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

    // Generate random students
    const numStudents = Math.floor(Math.random() * 11) + 15; // 15 to 25 students
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

    // Generate marks for each new student
    for (const student of newStudents) {
      for (const exam of exams) {
        // Random mark between 0 and totalMarks (can be decimal if totalMarks allows, but we'll stick to integers or half marks)
        // Let's generate a random integer mark
        const rawMark = Math.floor(Math.random() * (exam.totalMarks + 1));
        
        await Mark.findOneAndUpdate(
          { studentId: student._id, examId: exam._id },
          {
            studentId: student._id,
            examId: exam._id,
            courseId,
            userId: session.user.id,
            rawMark,
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
