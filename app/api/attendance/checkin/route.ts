import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import AttendanceSession from '@/models/AttendanceSession';
import Student from '@/models/Student';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import mongoose from 'mongoose';

export async function POST(req: NextRequest) {
  await dbConnect();

  const session = (await getServerSession(authOptions as any)) as any;
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const email = session.user.email.toLowerCase();
  if (!email.endsWith('@ulab.edu.bd')) {
    return NextResponse.json({ error: 'Email must be @ulab.edu.bd' }, { status: 403 });
  }

  let body: any = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const courseId = body?.courseId as string;
  if (!courseId) {
    return NextResponse.json({ error: 'Missing courseId' }, { status: 400 });
  }

  try {
    const activeSession = await AttendanceSession.findOne({
      courseId: new mongoose.Types.ObjectId(courseId),
      open: true,
    });

    if (!activeSession) {
      return NextResponse.json({ error: 'No active attendance session' }, { status: 400 });
    }

    const displayName = session.user.name || '';
    const match = displayName.match(/\(([^)]+)\)/);
    const parsedId = match ? match[1].trim() : null;

    if (!parsedId) {
      return NextResponse.json({ error: 'Could not parse student ID from account name' }, { status: 400 });
    }

    const student = await Student.findOne({ studentId: parsedId, courseId: new mongoose.Types.ObjectId(courseId) });
    if (!student) {
      return NextResponse.json({ error: 'Student not registered for this course' }, { status: 404 });
    }

    const existingIndex = activeSession.records.findIndex((record) => String(record.studentId) === String(student._id));
    const record = {
      studentId: student._id,
      status: 'present' as const,
      recordedAt: new Date(),
      markedBy: 'qr' as const,
      studentIdString: parsedId,
    };

    if (existingIndex >= 0) {
      activeSession.records[existingIndex] = record as any;
    } else {
      activeSession.records.push(record as any);
    }

    await activeSession.save();

    return NextResponse.json({ message: 'Attendance recorded', ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Error recording attendance' }, { status: 500 });
  }
}
