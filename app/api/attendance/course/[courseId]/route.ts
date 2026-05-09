import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Course from '@/models/Course';
import AttendanceSession from '@/models/AttendanceSession';
import mongoose from 'mongoose';

export async function GET(_req: NextRequest, { params }: { params: any }) {
  await dbConnect();

  const resolvedParams = await params;
  const courseId = resolvedParams.courseId as string;

  try {
    const [course, activeSession] = await Promise.all([
      Course.findById(courseId).lean(),
      AttendanceSession.findOne({
        courseId: new mongoose.Types.ObjectId(courseId),
        open: true,
      }).lean(),
    ]);

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    return NextResponse.json({
      course: {
        _id: String(course._id),
        name: course.name,
        code: course.code,
        section: course.section,
        semester: course.semester,
        year: course.year,
        hasActiveSession: Boolean(activeSession),
        open: Boolean(activeSession),
        // canonical ISO date for consistent client-side formatting
        dateISO: activeSession ? new Date(activeSession.date).toISOString() : new Date().toISOString(),
        // legacy label (kept for backward compatibility)
        dateLabel: activeSession ? new Date(activeSession.date).toLocaleDateString() : new Date().toLocaleDateString(),
      },
    });
  } catch (error) {
    console.error('Public attendance course lookup failed:', error);
    return NextResponse.json({ error: 'Unable to load course info' }, { status: 500 });
  }
}
