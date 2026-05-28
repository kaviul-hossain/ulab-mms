import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/mongodb';
import ProjectGroup from '@/models/ProjectGroup';
import Course from '@/models/Course';
import Exam from '@/models/Exam';
import Mark from '@/models/Mark';
import { calculateProjectMark } from '@/app/utils/projectRubric';

export async function POST(
  _req: NextRequest,
  { params }: { params: any }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const course = await Course.findOne({ _id: id, userId: session.user.id });
    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    const projectExams = await Exam.find({ courseId: id, examCategory: 'Project' });
    if (projectExams.length === 0) {
      return NextResponse.json(
        { error: 'No Project exam found. Please create an exam with category "Project" first.' },
        { status: 404 }
      );
    }

    const projectGroup = await ProjectGroup.findOne({ courseId: id });
    if (!projectGroup || projectGroup.groups.length === 0) {
      return NextResponse.json({ error: 'No project groups found' }, { status: 404 });
    }

    let totalUpdated = 0;

    for (const exam of projectExams) {
      const totalProjectMarks = exam.totalMarks;

      for (const group of projectGroup.groups) {
        if (group.studentIds.length === 0) continue;
        
        const examEntry = group.examRubricScores?.find((e: any) => e.examId?.toString() === exam._id.toString());
        if (!examEntry) continue; // skip if this exam wasn't scored yet for the group

        const computedMark = calculateProjectMark(examEntry.scores, totalProjectMarks);

        for (const studentId of group.studentIds) {
          await Mark.findOneAndUpdate(
            { studentId, examId: exam._id },
            { studentId, examId: exam._id, courseId: id, userId: session.user.id, rawMark: computedMark },
            { upsert: true, new: true, setDefaultsOnInsert: true }
          );
          totalUpdated++;
        }
      }
    }

    return NextResponse.json({
      success: true,
      updated: totalUpdated,
      examsUpdated: projectExams.map((e) => e.displayName),
    });
  } catch (error: any) {
    console.error('POST /project/marks error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
