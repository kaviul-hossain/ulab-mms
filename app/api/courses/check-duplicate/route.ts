import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import connectDB from '@/lib/mongodb';
import Course from '@/models/Course';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const semester = searchParams.get('semester');
    const year = searchParams.get('year');
    const section = searchParams.get('section');

    if (!code || !semester || !year || !section) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    await connectDB();

    // Check if course exists for this user with same code, semester, year, and section
    const existingCourse = await Course.findOne({
      userId: session.user.id,
      code,
      semester,
      year: parseInt(year),
      section,
    });

    return NextResponse.json({
      exists: !!existingCourse,
      course: existingCourse ? {
        name: existingCourse.name,
        code: existingCourse.code,
        semester: existingCourse.semester,
        year: existingCourse.year,
        section: existingCourse.section,
      } : null,
    });
  } catch (error) {
    console.error('Error checking duplicate:', error);
    return NextResponse.json(
      { error: 'Failed to check for duplicates' },
      { status: 500 }
    );
  }
}
