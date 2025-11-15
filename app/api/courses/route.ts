import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/mongodb';
import Course from '@/models/Course';
import Exam from '@/models/Exam';

// GET all courses for the authenticated user
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const courses = await Course.find({ userId: session.user.id }).sort({
      createdAt: -1,
    });

    return NextResponse.json({ courses }, { status: 200 });
  } catch (error: any) {
    console.error('Get courses error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST create a new course
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, code, semester, year, courseType } = await request.json();

    // Validation
    if (!name || !code || !semester || !year || !courseType) {
      return NextResponse.json(
        { error: 'Please provide all required fields' },
        { status: 400 }
      );
    }

    if (!['Spring', 'Summer', 'Fall'].includes(semester)) {
      return NextResponse.json(
        { error: 'Invalid semester. Must be Spring, Summer, or Fall' },
        { status: 400 }
      );
    }

    if (!['Theory', 'Lab'].includes(courseType)) {
      return NextResponse.json(
        { error: 'Invalid course type. Must be Theory or Lab' },
        { status: 400 }
      );
    }

    await dbConnect();

    const course = await Course.create({
      name,
      code,
      semester,
      year,
      courseType,
      userId: session.user.id,
    });

    // Auto-initialize required exams based on course type
    let examsToCreate: any[] = [];

    if (courseType === 'Theory') {
      // Theory courses: Midterm and Final with CO breakdown
      examsToCreate = [
        {
          courseId: course._id,
          displayName: 'Midterm',
          examType: 'midterm',
          totalMarks: 25,
          weightage: 25,
          scalingEnabled: false,
          isRequired: true,
          examCategory: 'MainExam',
          numberOfCOs: 3, // Default 3 COs, can be edited later
          userId: session.user.id,
        },
        {
          courseId: course._id,
          displayName: 'Final',
          examType: 'final',
          totalMarks: 40,
          weightage: 40,
          examCategory: 'MainExam',
          scalingEnabled: false,
          isRequired: true,
          numberOfCOs: 4, // Default 4 COs, can be edited later
          userId: session.user.id,
        },
      ];
    } else if (courseType === 'Lab') {
      // Lab courses: Lab Final and OEL/CE Project
      examsToCreate = [
        {
          courseId: course._id,
          displayName: 'Lab Final',
          examType: 'labFinal',
          totalMarks: 30,
          weightage: 30,
          examCategory: 'MainExam',
          scalingEnabled: false,
          isRequired: true,
          userId: session.user.id,
        },
        {
          courseId: course._id,
          displayName: 'OEL/CE Project',
          examType: 'oel',
          totalMarks: 40,
          weightage: 40,
          examCategory: 'MainExam',
          scalingEnabled: false,
          isRequired: true,
          userId: session.user.id,
        },
      ];
    }

    // Create the required exams
    if (examsToCreate.length > 0) {
      await Exam.insertMany(examsToCreate);
    }

    return NextResponse.json({ course }, { status: 201 });
  } catch (error: any) {
    console.error('Create course error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
