import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/mongodb';
import Course from '@/models/Course';
import Student from '@/models/Student';
import Exam from '@/models/Exam';
import Mark from '@/models/Mark';
import AttendanceSession from '@/models/AttendanceSession';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const resolvedParams = await params;
    const courseId = resolvedParams.id;

    // Parse body for repopulate flag
    let repopulate = false;
    try {
      const body = await request.json();
      repopulate = !!body?.repopulate;
    } catch { /* no body or not JSON — treat as fresh populate */ }

    const course = await Course.findOne({
      _id: courseId,
      userId: session.user.id,
    });

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    if (course.code !== 'TESTCODE123') {
      return NextResponse.json(
        { error: 'Test data population is only allowed for course TESTCODE123' },
        { status: 403 }
      );
    }

    // If repopulate, delete existing students, marks, and attendance records first
    if (repopulate) {
      const existingStudents = await Student.find({ courseId });
      const existingStudentIds = existingStudents.map(s => s._id);
      await Mark.deleteMany({ courseId });
      await Student.deleteMany({ courseId });
      await AttendanceSession.deleteMany({ courseId });
    }

    // Generate random students
    const numStudents = Math.floor(Math.random() * 11) + 30; // 30 to 40 students
    const newStudents = [];
    
    for (let i = 0; i < numStudents; i++) {
      const studentIdStr = `TEST-${Math.floor(Math.random() * 90000) + 10000}`; // TEST-XXXXX
      const name = `Mock Student ${studentIdStr.replace('TEST-', '')}`;
      
      // Upsert to handle unlikely random ID collisions gracefully
      const student = await Student.findOneAndUpdate(
        { courseId, studentId: studentIdStr },
        {
          studentId: studentIdStr,
          name,
          courseId,
          userId: session.user.id,
        },
        { upsert: true, new: true }
      );
      newStudents.push(student);
    }

    // Fetch exams
    const exams = await Exam.find({ courseId });

    // Populate CO PO Mapping
    let maxMarks: Record<string, number[]> = {};
    exams.forEach(exam => {
      if (exam.numberOfCOs && exam.numberOfCOs > 0) {
        let marks = [0, 0, 0, 0, 0, 0];
        let remaining = exam.totalMarks;
        const base = Math.floor(exam.totalMarks / exam.numberOfCOs);
        for (let i = 0; i < exam.numberOfCOs; i++) {
          marks[i] = i === exam.numberOfCOs - 1 ? remaining : base;
          remaining -= base;
        }
        maxMarks[String(exam._id)] = marks;
      }
    });

    let mapping = Array(6).fill(null).map(() => Array(12).fill(false));
    for (let co = 0; co < 6; co++) {
      const numPos = Math.floor(Math.random() * 3) + 1; // 1 to 3 POs mapped
      for (let i = 0; i < numPos; i++) {
        const randomPo = Math.floor(Math.random() * 12);
        mapping[co][randomPo] = true;
      }
    }

    await Course.findOneAndUpdate(
      { _id: courseId, userId: session.user.id },
      { $set: { coPoMapping: { maxMarks, mapping } } }
    );

    // Generate marks for each new student
    for (const student of newStudents) {
      for (const exam of exams) {
        // Random mark between 0 and totalMarks (can be decimal if totalMarks allows, but we'll stick to integers or half marks)
        // Let's generate a random integer mark
        const rawMark = Math.floor(Math.random() * (exam.totalMarks + 1));
        
        let coMarks: number[] = [];
        if (exam.numberOfCOs && exam.numberOfCOs > 0) {
          let remaining = rawMark;
          for (let i = 0; i < exam.numberOfCOs - 1; i++) {
            // Give each CO a random portion of the remaining marks
            // Prevent one CO from taking everything by capping at Math.ceil(remaining / remaining_COs) or similar
            // For true random that sums up, we can just take a random number between 0 and remaining
            const maxForThisCO = Math.min(remaining, Math.ceil(exam.totalMarks / exam.numberOfCOs));
            const chunk = Math.floor(Math.random() * (maxForThisCO + 1));
            coMarks.push(chunk);
            remaining -= chunk;
          }
          coMarks.push(remaining);
          
          // Shuffle the array to avoid bias
          for (let i = coMarks.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [coMarks[i], coMarks[j]] = [coMarks[j], coMarks[i]];
          }
        }

        await Mark.findOneAndUpdate(
          { studentId: student._id, examId: exam._id },
          {
            studentId: student._id,
            examId: exam._id,
            courseId,
            userId: session.user.id,
            rawMark,
            ...(coMarks.length > 0 ? { coMarks } : {}),
          },
          { upsert: true }
        );
      }
    }

    // Fetch Attendance Sessions
    let sessions = await AttendanceSession.find({ courseId });
    
    // If no sessions exist, create 5 random ones
    if (sessions.length === 0) {
      for (let i = 0; i < 5; i++) {
        const date = new Date();
        date.setDate(date.getDate() - (i * 2)); // Every other day backwards
        const newSession = await AttendanceSession.create({
          courseId,
          startedBy: session.user.id,
          date,
          open: false,
          qrEnabled: false,
          records: [],
        });
        sessions.push(newSession);
      }
    }

    // Populate attendance records for the new students
    for (const attSession of sessions) {
      const existingStudentIds = attSession.records.map(r => r.studentId.toString());
      let modified = false;

      for (const student of newStudents) {
        if (!existingStudentIds.includes(student._id.toString())) {
          const status = Math.random() > 0.2 ? 'present' : 'absent'; // 80% present
          attSession.records.push({
            studentId: student._id,
            status,
            recordedAt: new Date(),
            markedBy: 'manual',
            studentIdString: student.studentId,
          });
          modified = true;
        }
      }

      if (modified) {
        await attSession.save();
      }
    }

    return NextResponse.json({ 
      message: 'Test data populated successfully',
      studentsAdded: newStudents.length,
      marksAdded: newStudents.length * exams.length,
    });

  } catch (error: any) {
    console.error('Test data error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
