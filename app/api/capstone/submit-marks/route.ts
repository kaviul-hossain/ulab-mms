import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/mongodb';
import CapstoneGroup from '@/models/CapstoneGroup';
import CapstoneMarks from '@/models/CapstoneMarks';
import { ResourceFolder } from '@/models/ResourceFolder';
import { StoredFile } from '@/models/StoredFile';
import User from '@/models/User';
import * as XLSX from 'xlsx';
import mongoose from 'mongoose';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await dbConnect();

    const { groupId, marks } = await request.json();
    if (!groupId || !Array.isArray(marks)) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      return NextResponse.json({ error: 'Invalid group id' }, { status: 400 });
    }

    const group = await CapstoneGroup.findById(groupId).populate('studentIds').populate('courseId').populate('supervisorId');
    if (!group) return NextResponse.json({ error: 'Group not found' }, { status: 404 });

    // Upsert marks for each student (weeklyJournal)
    const saved: any[] = [];
    for (const m of marks) {
      const studentId = m._id;
      const value = Number(m.marks ?? 0);
      if (!mongoose.Types.ObjectId.isValid(studentId)) continue;

      let doc = await CapstoneMarks.findOne({ studentId, supervisorId: group.supervisorId, courseId: group.courseId });
      if (!doc) {
        doc = new CapstoneMarks({ studentId, supervisorId: group.supervisorId, courseId: group.courseId, submittedBy: session.user.id });
      }
      doc.weeklyJournalMarks = value;
      doc.submissionType = 'weeklyJournal';
      doc.submittedBy = new mongoose.Types.ObjectId(session.user.id);
      await doc.save();
      saved.push({ studentId, value });
    }

    // Create Excel workbook
    const rows = marks.map((m: any) => ({ Name: m.name, StudentId: m.studentId, Marks: m.marks }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'WeeklyJournal');
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    // Ensure a folder exists
    let folder = await ResourceFolder.findOne({ name: 'Capstone - Weekly Journal' });
    if (!folder) {
      folder = await ResourceFolder.create({ name: 'Capstone - Weekly Journal', parentId: null, createdBy: session.user.id });
    }

    const originalName = `${group.groupName || 'group'}-weekly-journal-${new Date().toISOString()}.xlsx`;
    await StoredFile.create({ filename: originalName, originalName, folderId: folder._id, uploadedBy: session.user.id, fileSize: buffer.length, mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', fileData: buffer });

    return NextResponse.json({ ok: true, savedCount: saved.length });
  } catch (error: any) {
    console.error('POST /api/capstone/submit-marks error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

