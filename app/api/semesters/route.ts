import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Semester from '@/models/Semester';

export async function GET() {
  try {
    await dbConnect();

    const semesters = await Semester.find({ isActive: true })
      .sort({ createdAt: -1 });

    return NextResponse.json(semesters);
  } catch (error) {
    console.error('Error fetching semesters:', error);
    return NextResponse.json(
      { error: 'Failed to fetch semesters' },
      { status: 500 }
    );
  }
}
