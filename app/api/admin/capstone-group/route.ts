import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import dbConnect from '@/lib/mongodb';
import CapstoneGroup from '@/models/CapstoneGroup';
import Student from '@/models/Student';
import User from '@/models/User';
import Course from '@/models/Course';

const SECRET = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || 'your-secret-key');

// Verify admin token
async function verifyAdminToken(request: NextRequest): Promise<boolean> {
  try {
    const token = request.cookies.get('admin-token')?.value;
    if (!token) return false;

    const { payload } = await jwtVerify(token, SECRET);
    return payload.type === 'admin';
  } catch (error) {
    return false;
  }
}

export async function GET(request: NextRequest) {
  try {
    const isAdmin = await verifyAdminToken(request);

    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('courseId');
    const supervisorId = searchParams.get('supervisorId');

    const query: any = {};
    if (courseId) query.courseId = courseId;
    if (supervisorId) query.supervisorId = supervisorId;

    const groups = await CapstoneGroup.find(query)
      .populate({
        path: 'studentIds',
        select: 'name studentId email',
      })
      .populate({
        path: 'supervisorId',
        select: 'name email',
      })
      .populate({
        path: 'evaluatorAssignments.evaluatorId',
        select: 'name email',
      })
      .populate({
        path: 'courseId',
        select: 'name code',
      })
      .sort({ createdAt: -1 });

    return NextResponse.json(groups);
  } catch (error: any) {
    console.error('Error fetching capstone groups:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch groups' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const isAdmin = await verifyAdminToken(request);

    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await dbConnect();

    const body = await request.json();
    const {
      courseId,
      groupName,
      groupNumber,
      description,
      studentIds,
      supervisorId,
    } = body;

    // Validation
    if (!courseId || !groupName || !studentIds || studentIds.length === 0 || !supervisorId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }

    // Verify supervisor exists
    const supervisor = await User.findById(supervisorId);
    if (!supervisor) {
      return NextResponse.json(
        { error: 'Supervisor not found' },
        { status: 404 }
      );
    }

    // Verify all students exist
    const students = await Student.find({ _id: { $in: studentIds } });
    if (students.length !== studentIds.length) {
      return NextResponse.json(
        { error: 'One or more students not found' },
        { status: 404 }
      );
    }

    // Create new group
    const newGroup = new CapstoneGroup({
      courseId,
      groupName,
      groupNumber: groupNumber || null,
      description: description || '',
      studentIds,
      supervisorId,
      evaluatorAssignments: [],
      createdBy: request.cookies.get('admin-id')?.value || 'unknown',
    });

    await newGroup.save();

    const populatedGroup = await CapstoneGroup.findById(newGroup._id)
      .populate({
        path: 'studentIds',
        select: 'name studentId email',
      })
      .populate({
        path: 'supervisorId',
        select: 'name email',
      })
      .populate({
        path: 'courseId',
        select: 'name code',
      });

    return NextResponse.json(populatedGroup, { status: 201 });
  } catch (error: any) {
    console.error('Error creating capstone group:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create group' },
      { status: 500 }
    );
  }
}
