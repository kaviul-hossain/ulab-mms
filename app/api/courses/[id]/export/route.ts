/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/mongodb';
import Course from '@/models/Course';
import Student from '@/models/Student';
import Exam from '@/models/Exam';
import Mark from '@/models/Mark';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: courseId } = await params;
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'json';

    await dbConnect();

    const course = await Course.findOne({ _id: courseId, userId: session.user.id });

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    const students = await Student.find({ courseId })
      .sort({ studentId: 1, _id: 1 })
      .collation({ locale: 'en', numericOrdering: true });
    const exams = await Exam.find({ courseId });
    const marks = await Mark.find({ courseId });

    const exportData = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      course: {
        name: course.name,
        code: course.code,
        semester: course.semester,
        year: course.year,
        courseType: course.courseType,
        showFinalGrade: course.showFinalGrade,
        quizAggregation: course.quizAggregation,
        quizWeightage: course.quizWeightage,
        assignmentAggregation: course.assignmentAggregation,
        assignmentWeightage: course.assignmentWeightage,
        gradingScale: course.gradingScale,
      },
      students: students.map(student => ({
        studentId: student.studentId,
        name: student.name,
      })),
      exams: exams.map(exam => ({
        displayName: exam.displayName,
        examType: exam.examType,
        totalMarks: exam.totalMarks,
        weightage: exam.weightage,
        isRequired: exam.isRequired,
        examCategory: exam.examCategory,
        numberOfCOs: exam.numberOfCOs,
        numberOfQuestions: exam.numberOfQuestions,
      })),
      marks: marks.map(mark => {
        const student = students.find((s: any) => s._id.toString() === mark.studentId.toString());
        const exam = exams.find((e: any) => e._id.toString() === mark.examId.toString());

        return {
          studentId: student?.studentId,
          examDisplayName: exam?.displayName,
          rawMark: mark.rawMark,
          coMarks: mark.coMarks,
          questionMarks: mark.questionMarks,
          weightedMark: mark.weightedMark,
        };
      }),
    };

    if (format === 'csv') {
      const getAggregatedMark = (studentId: any, category: 'Quiz' | 'Assignment', aggregationMode?: 'average' | 'best'): any => {
        const categoryExams = exams.filter((e: any) => e.examCategory === category);
        const categoryMarks = marks.filter((m: any) =>
          m.studentId.toString() === studentId.toString() &&
          categoryExams.some((e: any) => e._id.toString() === m.examId.toString())
        );

        if (categoryMarks.length === 0) return null;

        if (aggregationMode === 'best') {
          let bestMark = categoryMarks[0];
          let bestValue = -Infinity;

          categoryMarks.forEach((mark: any) => {
            const exam = categoryExams.find((e: any) => e._id.toString() === mark.examId.toString());
            if (exam && mark.rawMark > bestValue) {
              bestValue = mark.rawMark;
              bestMark = mark;
            }
          });

          return bestMark;
        }

        const totalMarks = categoryMarks.reduce((sum: number, mark: any) => sum + mark.rawMark, 0);
        const avgMark = totalMarks / categoryMarks.length;

        return {
          rawMark: avgMark,
          isAggregated: true,
        };
      };

      const calculateFinalGrade = (studentId: any): number => {
        let totalContribution = 0;

        exams.forEach((exam: any) => {
          if (exam.examCategory === 'Quiz' || exam.examCategory === 'Assignment') {
            return;
          }

          const mark = marks.find((m: any) =>
            m.studentId.toString() === studentId.toString() &&
            m.examId.toString() === exam._id.toString()
          );

          if (mark) {
            const contribution = mark.weightedMark !== undefined && mark.weightedMark !== null
              ? mark.weightedMark
              : (mark.rawMark / exam.totalMarks) * exam.weightage;
            totalContribution += contribution;
          }
        });

        const hasQuizzes = exams.some((e: any) => e.examCategory === 'Quiz');
        if (hasQuizzes && course.quizWeightage) {
          const aggMark = getAggregatedMark(studentId, 'Quiz', course.quizAggregation);
          if (aggMark) {
            const quizExams = exams.filter((e: any) => e.examCategory === 'Quiz');
            const totalMarks = quizExams.length > 0 ? Math.max(...quizExams.map((e: any) => e.totalMarks)) : 100;
            const percentage = (aggMark.rawMark / totalMarks) * 100;
            totalContribution += (percentage * course.quizWeightage) / 100;
          }
        }

        const hasAssignments = exams.some((e: any) => e.examCategory === 'Assignment');
        if (hasAssignments && course.assignmentWeightage) {
          const aggMark = getAggregatedMark(studentId, 'Assignment', course.assignmentAggregation);
          if (aggMark) {
            const assignmentExams = exams.filter((e: any) => e.examCategory === 'Assignment');
            const totalMarks = assignmentExams.length > 0 ? Math.max(...assignmentExams.map((e: any) => e.totalMarks)) : 100;
            const percentage = (aggMark.rawMark / totalMarks) * 100;
            totalContribution += (percentage * course.assignmentWeightage) / 100;
          }
        }

        return totalContribution;
      };

      const csvRows: string[] = [];
      const headers = ['Student ID', 'Name'];

      const allIndividualExams = exams.filter((exam: any) => exam.examCategory !== 'Quiz' && exam.examCategory !== 'Assignment');
      const quizExams = exams.filter((exam: any) => exam.examCategory === 'Quiz');
      const assignmentExams = exams.filter((exam: any) => exam.examCategory === 'Assignment');
      const hasQuizzes = quizExams.length > 0;
      const hasAssignments = assignmentExams.length > 0;

      allIndividualExams.forEach((exam: any) => {
        headers.push(`${exam.displayName} (Raw)`);
        headers.push(`${exam.displayName} (Weighted)`);

        if (exam.numberOfCOs && exam.numberOfCOs > 0) {
          for (let i = 1; i <= exam.numberOfCOs; i++) {
            headers.push(`${exam.displayName} CO${i}`);
          }
        }

        if (exam.numberOfQuestions && exam.numberOfQuestions > 0) {
          for (let i = 1; i <= exam.numberOfQuestions; i++) {
            headers.push(`${exam.displayName} Q${i}`);
          }
        }
      });

      quizExams.forEach((exam: any) => {
        headers.push(`${exam.displayName} (Raw)`);
        headers.push(`${exam.displayName} (Weighted)`);
      });

      assignmentExams.forEach((exam: any) => {
        headers.push(`${exam.displayName} (Raw)`);
        headers.push(`${exam.displayName} (Weighted)`);
      });

      if (hasQuizzes && course.quizWeightage) {
        headers.push(`Quiz (Agg) - ${course.quizAggregation} • ${course.quizWeightage}%`);
      }

      if (hasAssignments && course.assignmentWeightage) {
        headers.push(`Assignment (Agg) - ${course.assignmentAggregation} • ${course.assignmentWeightage}%`);
      }

      if (course.showFinalGrade) {
        headers.push('Final Grade (Est.)');
      }

      csvRows.push(headers.map(h => `"${h}"`).join(','));

      students.forEach((student: any) => {
        const row: (string | number)[] = [student.studentId, student.name];

        allIndividualExams.forEach((exam: any) => {
          const mark = marks.find((m: any) =>
            m.studentId.toString() === student._id.toString() &&
            m.examId.toString() === exam._id.toString()
          );

          if (mark) {
            const weightedValue = mark.weightedMark !== undefined && mark.weightedMark !== null
              ? mark.weightedMark
              : Math.round(((mark.rawMark / exam.totalMarks) * exam.weightage) * 100) / 100;
            row.push(mark.rawMark);
            row.push(weightedValue);

            if (exam.numberOfCOs && exam.numberOfCOs > 0) {
              for (let i = 0; i < exam.numberOfCOs; i++) {
                row.push(mark.coMarks?.[i] ?? '-');
              }
            }

            if (exam.numberOfQuestions && exam.numberOfQuestions > 0) {
              for (let i = 0; i < exam.numberOfQuestions; i++) {
                row.push(mark.questionMarks?.[i] ?? '-');
              }
            }
          } else {
            row.push('-', '-');

            if (exam.numberOfCOs && exam.numberOfCOs > 0) {
              for (let i = 0; i < exam.numberOfCOs; i++) {
                row.push('-');
              }
            }

            if (exam.numberOfQuestions && exam.numberOfQuestions > 0) {
              for (let i = 0; i < exam.numberOfQuestions; i++) {
                row.push('-');
              }
            }
          }
        });

        quizExams.forEach((exam: any) => {
          const mark = marks.find((m: any) =>
            m.studentId.toString() === student._id.toString() &&
            m.examId.toString() === exam._id.toString()
          );

          if (mark) {
            const weightedValue = mark.weightedMark !== undefined && mark.weightedMark !== null
              ? mark.weightedMark
              : Math.round(((mark.rawMark / exam.totalMarks) * exam.weightage) * 100) / 100;
            row.push(mark.rawMark);
            row.push(weightedValue);
          } else {
            row.push('-', '-');
          }
        });

        assignmentExams.forEach((exam: any) => {
          const mark = marks.find((m: any) =>
            m.studentId.toString() === student._id.toString() &&
            m.examId.toString() === exam._id.toString()
          );

          if (mark) {
            const weightedValue = mark.weightedMark !== undefined && mark.weightedMark !== null
              ? mark.weightedMark
              : Math.round(((mark.rawMark / exam.totalMarks) * exam.weightage) * 100) / 100;
            row.push(mark.rawMark);
            row.push(weightedValue);
          } else {
            row.push('-', '-');
          }
        });

        if (hasQuizzes && course.quizWeightage) {
          const aggMark = getAggregatedMark(student._id, 'Quiz', course.quizAggregation);
          row.push(aggMark ? aggMark.rawMark.toFixed(2) : '-');
        }

        if (hasAssignments && course.assignmentWeightage) {
          const aggMark = getAggregatedMark(student._id, 'Assignment', course.assignmentAggregation);
          row.push(aggMark ? aggMark.rawMark.toFixed(2) : '-');
        }

        if (course.showFinalGrade) {
          row.push(calculateFinalGrade(student._id).toFixed(2));
        }

        csvRows.push(row.map(cell => typeof cell === 'string' ? `"${cell}"` : cell).join(','));
      });

      const csvContent = csvRows.join('\n');
      return new NextResponse(Buffer.from(csvContent, 'utf-8'), {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${course.code}_${course.name}_${new Date().toISOString().split('T')[0]}.csv"`,
        },
      });
    }

    // attendance_pdf handled by separate endpoint /api/courses/[id]/attendance-pdf

    return new NextResponse(Buffer.from(JSON.stringify(exportData, null, 2)), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${course.code}_${course.name}_backup_${new Date().toISOString().split('T')[0]}.json"`,
      },
    });
  } catch (error) {
    console.error('Export course error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
