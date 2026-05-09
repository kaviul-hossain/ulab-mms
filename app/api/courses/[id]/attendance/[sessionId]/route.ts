import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import AttendanceSession from '@/models/AttendanceSession';
import Course from '@/models/Course';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import mongoose from 'mongoose';

async function resolveParams(params: any) {
  const resolved = await params;
  return { courseId: resolved.id as string, sessionId: resolved.sessionId as string };
}

export async function DELETE(_req: NextRequest, { params }: { params: any }) {
  await dbConnect();

  const session = (await getServerSession(authOptions as any)) as any;
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { courseId, sessionId } = await resolveParams(params);

  try {
    const course = await Course.findById(courseId);
    if (!course) return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    if ((course.userId as any).toString() !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const deleted = await AttendanceSession.findOneAndDelete({
      _id: new mongoose.Types.ObjectId(sessionId),
      courseId: new mongoose.Types.ObjectId(courseId),
    });

    if (!deleted) {
      return NextResponse.json({ error: 'Attendance session not found' }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Error deleting attendance session' }, { status: 500 });
  }
}
