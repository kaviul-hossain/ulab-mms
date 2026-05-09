import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import AttendanceSession from '@/models/AttendanceSession';
import Course from '@/models/Course';
import Student from '@/models/Student';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import mongoose from 'mongoose';

async function resolveParams(params: any) {
  const resolved = await params;
  return resolved.id as string;
}

export async function GET(_req: NextRequest, { params }: { params: any }) {
  await dbConnect();
  const courseId = await resolveParams(params);

  try {
    const [sessions, activeSession] = await Promise.all([
      AttendanceSession.find({ courseId: new mongoose.Types.ObjectId(courseId) }).sort({ date: -1 }).lean(),
      AttendanceSession.findOne({ courseId: new mongoose.Types.ObjectId(courseId), open: true }).lean(),
    ]);

    return NextResponse.json({ sessions, activeSession: activeSession || null });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Error fetching attendance sessions' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: any }) {
  await dbConnect();

  const session = (await getServerSession(authOptions as any)) as any;
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const courseId = await resolveParams(params);

  try {
    const course = await Course.findById(courseId);
    if (!course) return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    if ((course.userId as any).toString() !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const activeSession = await AttendanceSession.findOne({ courseId: new mongoose.Types.ObjectId(courseId), open: true });

    if (activeSession) {
      activeSession.open = false;
      await activeSession.save();
      return NextResponse.json({ session: activeSession, action: 'closed' });
    }

    const today = new Date();
    const sessionDoc = await AttendanceSession.create({
      courseId: new mongoose.Types.ObjectId(courseId),
      startedBy: new mongoose.Types.ObjectId(session.user.id),
      date: today,
      open: true,
      sessionCode: `${courseId}-${today.getTime()}`,
      records: [],
    });

    return NextResponse.json({ session: sessionDoc, action: 'opened' });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Error toggling attendance session' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: any }) {
  await dbConnect();

  const session = (await getServerSession(authOptions as any)) as any;
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const courseId = await resolveParams(params);

  try {
    const course = await Course.findById(courseId);
    if (!course) return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    if ((course.userId as any).toString() !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { sessionId, studentId, status } = body as {
      sessionId?: string;
      studentId?: string;
      status?: 'present' | 'absent';
    };

    if (!sessionId || !studentId || !status) {
      return NextResponse.json({ error: 'sessionId, studentId and status are required' }, { status: 400 });
    }

    const targetSession = await AttendanceSession.findOne({
      _id: sessionId,
      courseId: new mongoose.Types.ObjectId(courseId),
    });

    if (!targetSession) {
      return NextResponse.json({ error: 'Attendance session not found' }, { status: 404 });
    }

    const student = await Student.findOne({ _id: studentId, courseId: new mongoose.Types.ObjectId(courseId) });
    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    const existingIndex = targetSession.records.findIndex((record) => String(record.studentId) === String(student._id));
    const record = {
      studentId: student._id,
      status,
      recordedAt: new Date(),
      markedBy: 'manual' as const,
      studentIdString: student.studentId,
    };

    if (existingIndex >= 0) {
      targetSession.records[existingIndex] = record as any;
    } else {
      targetSession.records.push(record as any);
    }

    await targetSession.save();
    return NextResponse.json({ session: targetSession });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Error updating attendance record' }, { status: 500 });
  }
}
