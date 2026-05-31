import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/mongodb';
import Course from '@/models/Course';
import Mark from '@/models/Mark';
import Exam from '@/models/Exam';
import ProjectGroup from '@/models/ProjectGroup';

/**
 * GET /api/courses/[id]/project/group-marks
 *
 * Returns existing Mark records for all Project-category exams in this course,
 * keyed by the group they belong to.
 *
 * Response shape:
 * {
 *   marks: {
 *     [groupId]: { [examId]: rawMark }
 *   }
 * }
 *
 * We derive the groupId by looking up which group each student belongs to.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: any }
) {
  try {
    const { id: courseId } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const course = await Course.findOne({ _id: courseId, userId: session.user.id });
    if (!course) return NextResponse.json({ error: 'Course not found' }, { status: 404 });

    const projectExams = await Exam.find({ courseId, examCategory: 'Project' });
    const projectGroup = await ProjectGroup.findOne({ courseId });

    if (!projectGroup || projectExams.length === 0) {
      return NextResponse.json({ marks: {} });
    }

    // Build a map: studentId → groupId
    const studentToGroup: Record<string, string> = {};
    for (const group of projectGroup.groups) {
      for (const sid of group.studentIds) {
        studentToGroup[sid.toString()] = group._id.toString();
      }
    }

    const examIds = projectExams.map(e => e._id);
    const markDocs = await Mark.find({ courseId, examId: { $in: examIds } });

    // Build result: { [groupId]: { [examId]: rawMark } }
    const marksResult: Record<string, Record<string, number>> = {};

    for (const mark of markDocs) {
      const groupId = studentToGroup[mark.studentId.toString()];
      if (!groupId) continue;
      if (!marksResult[groupId]) marksResult[groupId] = {};
      if (marksResult[groupId][mark.examId.toString()] === undefined) {
        marksResult[groupId][mark.examId.toString()] = mark.rawMark;
      }
    }

    // Build examRubricScores result: { [groupId]: { [examId]: { scores, markMode } } }
    const rubricResult: Record<string, Record<string, { scores: Record<string, number>; markMode: string }>> = {};
    for (const group of projectGroup.groups) {
      const gid = group._id.toString();
      rubricResult[gid] = {};
      for (const entry of (group as any).examRubricScores ?? []) {
        const eid = entry.examId?.toString();
        if (eid) {
          rubricResult[gid][eid] = {
            scores: entry.scores ?? { c1: 0, c2: 0, c3: 0, c4: 0, c5: 0 },
            markMode: entry.markMode ?? 'direct',
          };
        }
      }
    }

    return NextResponse.json({ marks: marksResult, examRubricScores: rubricResult });
  } catch (error: any) {
    console.error('GET /project/group-marks error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/courses/[id]/project/group-marks
 *
 * Body:
 * {
 *   groupId: string,
 *   studentIds: string[],
 *   marks: { examId: string; rawMark: number }[]
 * }
 *
 * Upserts Mark records for every student in the group for each exam.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: any }
) {
  try {
    const { id: courseId } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const course = await Course.findOne({ _id: courseId, userId: session.user.id });
    if (!course) return NextResponse.json({ error: 'Course not found' }, { status: 404 });

    const body = await req.json();
    const { studentIds, marks } = body as {
      groupId: string;
      studentIds: string[];
      marks: { examId: string; rawMark: number }[];
    };

    if (!studentIds || !marks || marks.length === 0) {
      return NextResponse.json({ error: 'studentIds and marks are required' }, { status: 400 });
    }

    // Verify all exams belong to this course and are Project category
    const examIds = marks.map(m => m.examId);
    const exams = await Exam.find({ _id: { $in: examIds }, courseId, examCategory: 'Project' });
    if (exams.length !== examIds.length) {
      return NextResponse.json({ error: 'One or more exams not found or not a Project exam' }, { status: 400 });
    }

    let totalUpdated = 0;

    for (const { examId, rawMark } of marks) {
      const exam = exams.find(e => e._id.toString() === examId);
      if (!exam) continue;

      for (const studentId of studentIds) {
        await Mark.findOneAndUpdate(
          { studentId, examId, courseId },
          {
            studentId,
            examId,
            courseId,
            userId: session.user.id,
            rawMark,
            // weightedMark will be computed at aggregation level (project uses sum → weighted)
            weightedMark: null,
          },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
        totalUpdated++;
      }
    }

    return NextResponse.json({ success: true, updated: totalUpdated });
  } catch (error: any) {
    console.error('POST /project/group-marks error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
