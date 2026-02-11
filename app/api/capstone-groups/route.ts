import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/mongodb';
import CapstoneGroup from '@/models/CapstoneGroup';
import User from '@/models/User';

const ALLOWED_COURSES = ['CSE4098A', 'CSE4098B', 'CSE4098C', 'CSE499'];

// GET capstone groups (supervisor only, or all groups if requested)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    // Check if requesting all groups
    const url = new URL(request.url);
    const getAll = url.searchParams.get('all') === 'true';

    let query: any = {};

    if (!getAll) {
      // Filter by current supervisor if not requesting all
      query.supervisorId = session.user.id;
    }

    // Get capstone groups
    const groups = await CapstoneGroup.find(query)
      .populate('courseId', 'name code')
      .populate('supervisorId', 'name email')
      .populate('studentIds', 'name studentId rollNumber')
      .sort({ createdAt: -1 });

    // Filter by allowed course codes
    const filteredGroups = groups.filter((group: any) => {
      return ALLOWED_COURSES.includes(group.courseId?.code);
    });

    if (getAll) {
      console.log('Fetched all capstone groups:', filteredGroups.length);
    } else {
      const user = await User.findById(session.user.id);
      console.log(
        'Fetched groups for supervisor:',
        user?.email,
        '- Count:',
        filteredGroups.length
      );
    }

    return NextResponse.json(filteredGroups, { status: 200 });
  } catch (error: any) {
    console.error('Get capstone groups error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
