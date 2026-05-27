import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/mongodb';
import Course from '@/models/Course';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: courseId } = await params;
    const { maxMarks, mapping } = await request.json();

    if (!maxMarks || !mapping) {
      return NextResponse.json(
        { error: 'Missing required mapping data' },
        { status: 400 }
      );
    }

    await dbConnect();

    // Verify course exists and update it
    const course = await Course.findOneAndUpdate(
      { _id: courseId, userId: session.user.id },
      { $set: { coPoMapping: { maxMarks, mapping } } },
      { new: true }
    );

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, course }, { status: 200 });
  } catch (error: any) {
    console.error('Update CO PO Mapping error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
