import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Student from '@/models/Student';

// GET all students (public endpoint for admin panel use)
export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    // Fetch all students with basic info
    const students = await Student.find({})
      .select('_id name studentId courseId')
      .sort({ name: 1 });

    return NextResponse.json(students, { status: 200 });
  } catch (error: any) {
    console.error('Get students list error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
