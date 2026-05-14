import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import CapstoneGroup from '@/models/CapstoneGroup';
import mongoose from 'mongoose';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid group ID' }, { status: 400 });
    }

    await dbConnect();

    const group = await CapstoneGroup.findById(id)
      .populate({ path: 'studentIds', select: 'name studentId rollNumber' })
      .populate({ path: 'supervisorId', select: 'name email' })
      .populate({ path: 'courseId', select: 'name code' });

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    return NextResponse.json(group, { status: 200 });
  } catch (error) {
    console.error('Error fetching capstone group:', error);
    return NextResponse.json({ error: 'Failed to fetch group' }, { status: 500 });
  }
}
