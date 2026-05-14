import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/mongodb';
import CapstoneGroup from '@/models/CapstoneGroup';
import Semester from '@/models/Semester';
import { StoredFile } from '@/models/StoredFile';
import { ResourceFolder } from '@/models/ResourceFolder';
import mongoose from 'mongoose';
import * as XLSX from 'xlsx';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { groupId, marks } = body;

    if (!groupId || !Array.isArray(marks)) {
      return NextResponse.json({ error: 'Missing groupId or marks' }, { status: 400 });
    }

    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      return NextResponse.json({ error: 'Invalid groupId' }, { status: 400 });
    }

    await dbConnect();

    const group = await CapstoneGroup.findById(groupId)
      .populate({ path: 'studentIds', select: 'name studentId rollNumber' })
      .populate({ path: 'courseId', select: 'name code' });

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    // Prepare Excel data
    const rows = [['Student Name', 'Student ID', 'Marks (0-10)']];
    for (const m of marks) {
      rows.push([m.name || '', m.studentId || '', m.marks != null ? m.marks : '']);
    }

    const ws = XLSX.utils.aoa_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Marks');
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    // Find or create Capstone Marks folder
    let folder = await ResourceFolder.findOne({ name: 'Capstone Marks', parentId: null });
    if (!folder) {
      folder = new ResourceFolder({ name: 'Capstone Marks', parentId: null, createdBy: session.user.id });
      await folder.save();
    }

    const filename = `capstone-marks-${group.groupName.replace(/\s+/g, '_')}-${Date.now()}.xlsx`;

    const stored = new StoredFile({
      filename,
      originalName: filename,
      folderId: folder._id,
      uploadedBy: session.user.id,
      fileSize: buffer.length,
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      fileData: Buffer.from(buffer),
    });

    await stored.save();

    return NextResponse.json({ success: true, message: 'Marks submitted and saved', fileId: stored._id }, { status: 201 });
  } catch (error: any) {
    console.error('Error submitting marks:', error);
    return NextResponse.json({ error: error.message || 'Failed to submit marks' }, { status: 500 });
  }
}
