import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import * as XLSX from 'xlsx';
import dbConnect from '@/lib/mongodb';
import CapstoneGroup from '@/models/CapstoneGroup';
import { ResourceFolder } from '@/models/ResourceFolder';
import { StoredFile } from '@/models/StoredFile';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import mongoose from 'mongoose';

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

    const rows = [['Student Name', 'Student ID', 'Marks (0-5)']];
    for (const m of marks) {
      rows.push([m.name || '', m.studentId || '', m.marks != null ? m.marks : '']);
    }

    const ws = XLSX.utils.aoa_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Peer Marks');
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    const filename = `capstone-peer-marks-${group.groupName.replace(/\s+/g, '_')}-${Date.now()}.xlsx`;

    let folder = await ResourceFolder.findOne({ name: 'Capstone Peer Marks', parentId: null });
    if (!folder) {
      folder = new ResourceFolder({ name: 'Capstone Peer Marks', parentId: null, createdBy: session.user.id });
      await folder.save();
    }

    const storedFile = new StoredFile({
      filename,
      originalName: filename,
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      folderId: folder._id,
      uploadedBy: session.user.id,
      fileData: Buffer.from(buffer),
      fileSize: buffer.length,
    });

    await storedFile.save();

    return NextResponse.json({
      success: true,
      message: 'Peer marks submitted successfully',
      fileId: storedFile._id
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error submitting peer marks:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to submit marks' },
      { status: 500 }
    );
  }
}
