import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/mongodb';
import Exam from '@/models/Exam';
import Course from '@/models/Course';

// POST create a custom exam
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { courseId, displayName, totalMarks, weightage, numberOfCOs } =
      await request.json();

    // Validation
    if (!courseId || !displayName || !totalMarks || weightage === undefined) {
      return NextResponse.json(
        { error: 'Please provide all required fields' },
        { status: 400 }
      );
    }

    if (weightage < 0 || weightage > 100) {
      return NextResponse.json(
        { error: 'Weightage must be between 0 and 100' },
        { status: 400 }
      );
    }

    if (totalMarks <= 0) {
      return NextResponse.json(
        { error: 'Total marks must be greater than 0' },
        { status: 400 }
      );
    }

    await dbConnect();

    // Verify course exists and belongs to user
    const course = await Course.findOne({
      _id: courseId,
      userId: session.user.id,
    });

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    const examData: any = {
      courseId,
      displayName,
      examType: 'custom',
      totalMarks,
      weightage,
      scalingEnabled: false,
      isRequired: false,
      userId: session.user.id,
    };

    // Add numberOfCOs if provided (for theory courses)
    if (numberOfCOs !== undefined && numberOfCOs > 0) {
      if (numberOfCOs > 10) {
        return NextResponse.json(
          { error: 'Number of COs must be between 1 and 10' },
          { status: 400 }
        );
      }
      examData.numberOfCOs = numberOfCOs;
    }

    const exam = await Exam.create(examData);

    return NextResponse.json({ exam }, { status: 201 });
  } catch (error: any) {
    console.error('Create exam error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
