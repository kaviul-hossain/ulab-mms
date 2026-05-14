import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/mongodb';
import CapstoneGroup from '@/models/CapstoneGroup';
import User from '@/models/User';
import Semester from '@/models/Semester';

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

    // Normalize semester field: if semester contains a Semester _id, replace with name
    const semesterIds = new Set<string>();
    filteredGroups.forEach((g: any) => {
      if (g.semester && typeof g.semester === 'string' && /^[0-9a-fA-F]{24}$/.test(g.semester)) {
        semesterIds.add(g.semester);
      }
    });

    let semesterMap: Record<string, string> = {};
    if (semesterIds.size > 0) {
      const semDocs = await Semester.find({ _id: { $in: Array.from(semesterIds) } }).select('name');
      semDocs.forEach((s: any) => {
        semesterMap[s._id.toString()] = s.name;
      });
    }

    const normalized = filteredGroups.map((g: any) => {
      const copy: any = g.toObject ? g.toObject() : { ...g };
      if (copy.semester && semesterMap[copy.semester]) {
        copy.semester = semesterMap[copy.semester];
      }
      return copy;
    });

    if (getAll) {
      console.log('Fetched all capstone groups:', normalized.length);
    } else {
      const user = await User.findById(session.user.id);
      console.log(
        'Fetched groups for supervisor:',
        user?.email,
        '- Count:',
        normalized.length
      );
    }

    return NextResponse.json(normalized, { status: 200 });
  } catch (error: any) {
    console.error('Get capstone groups error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
