import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/mongodb';
import Course from '@/models/Course';
import Exam from '@/models/Exam';
import { getDefaultExamSeeds } from '../../lib/defaultExams';

// POST - Initialize required exams for a course
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    await dbConnect();

    // Get the course
    const course = await Course.findOne({
      _id: id,
      userId: session.user.id,
    });

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    // Check if exams already exist
    const existingExams = await Exam.find({ courseId: id });
    if (existingExams.length > 0) {
      return NextResponse.json(
        { error: 'Exams already initialized for this course' },
        { status: 400 }
      );
    }

    const examsToCreate = getDefaultExamSeeds(course.courseType).map((exam) => ({
      courseId: id,
      userId: session.user.id,
      ...exam,
    }));

    const createdExams = await Exam.insertMany(examsToCreate);

    return NextResponse.json(
      {
        message: 'Required exams initialized successfully',
        exams: createdExams,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Initialize exams error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
