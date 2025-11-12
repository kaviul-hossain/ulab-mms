import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/mongodb';
import Mark from '@/models/Mark';
import Student from '@/models/Student';
import Exam from '@/models/Exam';

// POST create or update a mark
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { studentId, examId, courseId, rawMark, coMarks } = await request.json();

    if (!studentId || !examId || !courseId || rawMark === undefined) {
      return NextResponse.json(
        { error: 'Please provide all required fields' },
        { status: 400 }
      );
    }

    await dbConnect();

    // Verify student and exam exist and belong to user
    const [student, exam] = await Promise.all([
      Student.findOne({ _id: studentId, userId: session.user.id }),
      Exam.findOne({ _id: examId, userId: session.user.id }),
    ]);

    if (!student || !exam) {
      return NextResponse.json(
        { error: 'Student or exam not found' },
        { status: 404 }
      );
    }

    // Validate raw mark
    if (rawMark < 0 || rawMark > exam.totalMarks) {
      return NextResponse.json(
        { error: `Raw mark must be between 0 and ${exam.totalMarks}` },
        { status: 400 }
      );
    }

    // Validate CO marks if provided
    if (coMarks && Array.isArray(coMarks)) {
      // Check if exam requires CO marks
      if (exam.numberOfCOs && exam.numberOfCOs > 0) {
        if (coMarks.length !== exam.numberOfCOs) {
          return NextResponse.json(
            { error: `Expected ${exam.numberOfCOs} CO marks` },
            { status: 400 }
          );
        }

        // Validate CO marks sum equals raw mark
        const coMarksSum = coMarks.reduce((sum: number, cm: number) => sum + cm, 0);
        if (Math.abs(coMarksSum - rawMark) > 0.01) {
          return NextResponse.json(
            { error: `CO marks must sum to ${rawMark}. Current sum: ${coMarksSum.toFixed(2)}` },
            { status: 400 }
          );
        }

        // Validate each CO mark is non-negative
        if (coMarks.some((cm: number) => cm < 0)) {
          return NextResponse.json(
            { error: 'CO marks cannot be negative' },
            { status: 400 }
          );
        }
      }
    }

    // Create or update mark
    const markData: any = {
      studentId,
      examId,
      courseId,
      userId: session.user.id,
      rawMark,
    };

    if (coMarks && Array.isArray(coMarks) && coMarks.length > 0) {
      markData.coMarks = coMarks;
    }

    const mark = await Mark.findOneAndUpdate(
      { studentId, examId },
      markData,
      { upsert: true, new: true, runValidators: true }
    );

    return NextResponse.json({ mark }, { status: 201 });
  } catch (error: any) {
    console.error('Create/update mark error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
