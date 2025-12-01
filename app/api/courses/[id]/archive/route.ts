import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import dbConnect from '@/lib/mongodb';
import Course from '@/models/Course';

// PATCH /api/courses/[id]/archive - Toggle archive status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const { isArchived } = await request.json();
    const { id } = await params;

    // Find and update the course
    const course = await Course.findOne({ 
      _id: id,
      userId: (session.user as any).id 
    });

    if (!course) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }

    course.isArchived = isArchived;
    course.archivedAt = isArchived ? new Date() : undefined;
    await course.save();

    return NextResponse.json({
      success: true,
      course,
    });
  } catch (error: any) {
    console.error('Archive course error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update archive status' },
      { status: 500 }
    );
  }
}
