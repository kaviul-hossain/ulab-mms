import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/mongodb';
import CapstoneMarks from '@/models/CapstoneMarks';
import Student from '@/models/Student';
import User from '@/models/User';
import mongoose from 'mongoose';

// GET - Fetch capstone marks with filters
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const submissionType = searchParams.get('submissionType');
    const studentId = searchParams.get('studentId');

    let query: any = { submittedBy: new mongoose.Types.ObjectId(session.user.id) };

    if (submissionType) {
      query.submissionType = submissionType;
    }

    if (studentId) {
      query.studentId = studentId;
    }

    const capstoneMarks = await CapstoneMarks.find(query)
      .populate('studentId', 'name rollNumber')
      .populate('supervisorId', 'name email')
      .populate('evaluatorId', 'name email')
      .sort({ createdAt: -1 });

    return NextResponse.json(capstoneMarks);
  } catch (error) {
    console.error('GET /api/capstone error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch capstone marks' },
      { status: 500 }
    );
  }
}

// POST - Create or update capstone marks
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const {
      studentId,
      supervisorId,
      evaluatorId,
      supervisorMarks,
      supervisorComments,
      evaluatorMarks,
      evaluatorComments,
      submissionType,
    } = await request.json();

    // Validate required fields
    if (!studentId || !supervisorId || !submissionType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify student exists
    const student = await Student.findById(studentId);
    if (!student) {
      return NextResponse.json(
        { error: 'Student not found' },
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

    // Find or create capstone marks record
    let capstoneMarks = await CapstoneMarks.findOne({
      studentId,
      supervisorId,
    });

    if (!capstoneMarks) {
      capstoneMarks = new CapstoneMarks({
        studentId,
        supervisorId,
        evaluatorId: evaluatorId || null,
        submittedBy: session.user.id,
      });
    }

    // Update based on submission type
    if (submissionType === 'supervisor') {
      capstoneMarks.supervisorMarks = supervisorMarks;
      capstoneMarks.supervisorComments = supervisorComments || '';
    } else if (submissionType === 'evaluator') {
      capstoneMarks.evaluatorId = evaluatorId;
      capstoneMarks.evaluatorMarks = evaluatorMarks;
      capstoneMarks.evaluatorComments = evaluatorComments || '';
    }

    capstoneMarks.submissionType = submissionType;
    capstoneMarks.submittedBy = new mongoose.Types.ObjectId(session.user.id);

    // Calculate final marks if both are available
    if (capstoneMarks.supervisorMarks && capstoneMarks.evaluatorMarks) {
      capstoneMarks.finalMarks =
        (capstoneMarks.supervisorMarks + capstoneMarks.evaluatorMarks) / 2;
    }

    await capstoneMarks.save();

    return NextResponse.json(capstoneMarks);
  } catch (error) {
    console.error('POST /api/capstone error:', error);
    return NextResponse.json(
      { error: 'Failed to save capstone marks' },
      { status: 500 }
    );
  }
}
