import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/mongodb';
import CapstoneMarks from '@/models/CapstoneMarks';
import Student from '@/models/Student';
import User from '@/models/User';
import Course from '@/models/Course';
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
    const courseId = searchParams.get('courseId');
    const courseCode = searchParams.get('courseCode');
    const groupId = searchParams.get('groupId');

    let query: any = { submittedBy: new mongoose.Types.ObjectId(session.user.id) };

    if (submissionType) {
      query.submissionType = submissionType;
    }

    if (studentId) {
      query.studentId = studentId;
    }

    if (groupId) {
      query.groupId = new mongoose.Types.ObjectId(groupId);
    }

    // IMPORTANT: Filter by courseId if provided to prevent cross-course data leakage
    if (courseId) {
      query.courseId = new mongoose.Types.ObjectId(courseId);
    } else if (courseCode) {
      // If courseCode provided, look up the courseId
      const course = await Course.findOne({ code: courseCode });
      if (course) {
        query.courseId = course._id;
      }
    }

    const capstoneMarks = await CapstoneMarks.find(query)
      .populate('studentId', '_id name rollNumber studentId')
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
      courseId,
      groupId,
      evaluatorId,
      supervisorMarks,
      supervisorComments,
      evaluatorMarks,
      evaluatorComments,
      weeklyJournalMarks,
      weeklyJournalComments,
      peerMarks,
      peerComments,
      reportRubrics,
      reportMarks,
      reportComments,
      submissionType,
    } = await request.json();

    // Validate required fields - courseId is now required
    if (!studentId || !supervisorId || !submissionType || !courseId) {
      return NextResponse.json(
        { error: 'Missing required fields: studentId, supervisorId, courseId, and submissionType are required' },
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
    // IMPORTANT: Always include courseId AND groupId in the query to prevent cross-group contamination
    const query: any = {
      studentId,
      courseId,
      supervisorId,
      submissionType,
    };
    
    // Include groupId if provided to ensure group isolation
    if (groupId) {
      query.groupId = groupId;
    }
    
    let capstoneMarks = await CapstoneMarks.findOne(query);

    if (!capstoneMarks) {
      capstoneMarks = new CapstoneMarks({
        studentId,
        supervisorId,
        courseId,
        groupId: groupId || null,
        evaluatorId: evaluatorId || null,
        submittedBy: session.user.id,
        submissionType,
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
    } else if (submissionType === 'weeklyJournal') {
      capstoneMarks.weeklyJournalMarks = weeklyJournalMarks;
      capstoneMarks.weeklyJournalComments = weeklyJournalComments || '';
    } else if (submissionType === 'peer') {
      capstoneMarks.peerMarks = peerMarks;
      capstoneMarks.peerComments = peerComments || '';
    } else if (submissionType === 'report') {
      capstoneMarks.reportRubrics = reportRubrics || {};
      capstoneMarks.reportMarks = reportMarks;
      capstoneMarks.reportComments = reportComments || '';
    }

    capstoneMarks.submissionType = submissionType;
    capstoneMarks.submittedBy = new mongoose.Types.ObjectId(session.user.id);

    // Calculate final marks if both are available
    if (capstoneMarks.supervisorMarks && capstoneMarks.evaluatorMarks) {
      capstoneMarks.finalMarks =
        (capstoneMarks.supervisorMarks + capstoneMarks.evaluatorMarks) / 2;
    }

    try {
      await capstoneMarks.save();
    } catch (saveError: any) {
      // Handle duplicate key error from unique index
      if (saveError.code === 11000) {
        console.warn('Duplicate record attempt, refetching and updating:', saveError.message);
        // Refetch and update instead
        const existing = await CapstoneMarks.findOne(query);
        if (existing) {
          Object.assign(existing, capstoneMarks.toObject());
          await existing.save();
          return NextResponse.json(existing);
        }
      }
      throw saveError;
    }

    return NextResponse.json(capstoneMarks);
  } catch (error) {
    console.error('POST /api/capstone error:', error);
    return NextResponse.json(
      { error: 'Failed to save capstone marks' },
      { status: 500 }
    );
  }
}
