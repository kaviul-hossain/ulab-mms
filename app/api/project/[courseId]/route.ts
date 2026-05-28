import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import ProjectGroup from '@/models/ProjectGroup';
import Course from '@/models/Course';
import Student from '@/models/Student';

/**
 * Public API (no auth required) — used by the student-facing project page.
 */

export async function GET(
  _req: NextRequest,
  { params }: { params: any }
) {
  try {
    const { courseId } = await params;
    await dbConnect();

    const course = await Course.findById(courseId).select('name code semester year');
    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    const students = await Student.find({ courseId, withdrawn: { $ne: true } })
      .select('name studentId _id')
      .sort({ name: 1 });

    let projectGroup = await ProjectGroup.findOne({ courseId })
      .populate('groups.studentIds', 'name studentId');

    if (!projectGroup) {
      return NextResponse.json({
        course: { _id: course._id, name: course.name, code: course.code, semester: course.semester, year: course.year },
        students,
        isActive: false,
        maxMembersPerGroup: 4,
        groups: [],
      });
    }

    return NextResponse.json({
      course: { _id: course._id, name: course.name, code: course.code, semester: course.semester, year: course.year },
      students,
      isActive: projectGroup.isActive,
      maxMembersPerGroup: projectGroup.maxMembersPerGroup,
      groups: projectGroup.groups,
    });
  } catch (error: any) {
    console.error('GET /api/project/[courseId] error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: any }
) {
  try {
    const { courseId } = await params;
    await dbConnect();

    const body = await req.json();
    const { studentId, groupId, action, projectTitle } = body;

    if (!action) {
      return NextResponse.json({ error: 'action is required' }, { status: 400 });
    }

    const projectGroup = await ProjectGroup.findOne({ courseId });
    if (!projectGroup) {
      return NextResponse.json({ error: 'Project session not started' }, { status: 404 });
    }

    if (!projectGroup.isActive) {
      return NextResponse.json({ error: 'Project session is not active' }, { status: 403 });
    }

    // ── createGroup: student creates a new group and auto-joins it ──────────
    if (action === 'createGroup') {
      if (!studentId) {
        return NextResponse.json({ error: 'studentId is required' }, { status: 400 });
      }

      const student = await Student.findOne({ _id: studentId, courseId });
      if (!student) {
        return NextResponse.json({ error: 'Student not found in this course' }, { status: 404 });
      }

      // Check if already in a group
      const alreadyInGroup = projectGroup.groups.some((g: any) =>
        g.studentIds.some((sid: any) => sid.toString() === studentId)
      );
      if (alreadyInGroup) {
        return NextResponse.json({ error: 'You are already in a group. Leave it first.' }, { status: 400 });
      }

      // Auto-assign next group number
      const maxNum = projectGroup.groups.reduce(
        (max: number, g: any) => Math.max(max, g.groupNumber), 0
      );

      projectGroup.groups.push({
        groupNumber: maxNum + 1,
        projectTitle: '',
        studentIds: [studentId],
        rubricScores: { c1: 0, c2: 0, c3: 0, c4: 0, c5: 0 },
        markedAt: null,
      } as any);

      await projectGroup.save();
      await projectGroup.populate('groups.studentIds', 'name studentId');

      return NextResponse.json({
        isActive: projectGroup.isActive,
        maxMembersPerGroup: projectGroup.maxMembersPerGroup,
        groups: projectGroup.groups,
      });
    }

    // ── join / leave ─────────────────────────────────────────────────────────
    if (action === 'join' || action === 'leave') {
      if (!studentId || !groupId) {
        return NextResponse.json({ error: 'studentId and groupId are required' }, { status: 400 });
      }

      const student = await Student.findOne({ _id: studentId, courseId });
      if (!student) {
        return NextResponse.json({ error: 'Student not found in this course' }, { status: 404 });
      }

      const targetGroup = (projectGroup.groups as any).id(groupId);
      if (!targetGroup) {
        return NextResponse.json({ error: 'Group not found' }, { status: 404 });
      }

      if (action === 'join') {
        const alreadyInGroup = projectGroup.groups.some((g: any) =>
          g.studentIds.some((sid: any) => sid.toString() === studentId)
        );
        if (alreadyInGroup) {
          return NextResponse.json({ error: 'You are already in a group. Leave it first.' }, { status: 400 });
        }

        if (targetGroup.studentIds.length >= projectGroup.maxMembersPerGroup) {
          return NextResponse.json(
            { error: `This group is full (max ${projectGroup.maxMembersPerGroup} members)` },
            { status: 400 }
          );
        }

        targetGroup.studentIds.push(studentId as any);
      } else {
        // leave
        const idx = targetGroup.studentIds.findIndex(
          (sid: any) => sid.toString() === studentId
        );
        if (idx === -1) {
          return NextResponse.json({ error: 'You are not in this group' }, { status: 400 });
        }
        targetGroup.studentIds.splice(idx, 1);
      }
    }

    // ── setTitle ─────────────────────────────────────────────────────────────
    if (action === 'setTitle') {
      if (!groupId || projectTitle === undefined) {
        return NextResponse.json({ error: 'groupId and projectTitle are required' }, { status: 400 });
      }
      const targetGroup = (projectGroup.groups as any).id(groupId);
      if (!targetGroup) {
        return NextResponse.json({ error: 'Group not found' }, { status: 404 });
      }

      if (studentId) {
        const isMember = targetGroup.studentIds.some(
          (sid: any) => sid.toString() === studentId
        );
        if (!isMember) {
          return NextResponse.json({ error: 'Only group members can update the project title' }, { status: 403 });
        }
      }

      targetGroup.projectTitle = projectTitle;
    }

    await projectGroup.save();
    await projectGroup.populate('groups.studentIds', 'name studentId');

    return NextResponse.json({
      isActive: projectGroup.isActive,
      maxMembersPerGroup: projectGroup.maxMembersPerGroup,
      groups: projectGroup.groups,
    });
  } catch (error: any) {
    console.error('PATCH /api/project/[courseId] error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
