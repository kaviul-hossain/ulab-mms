import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { ResourceFolder } from '@/models/ResourceFolder';
import { StoredFile } from '@/models/StoredFile';

export async function GET() {
  try {
    await dbConnect();
    const folder = await ResourceFolder.findOne({ name: 'Capstone - Weekly Journal' });
    if (!folder) return NextResponse.json({ files: [] });
    const files = await StoredFile.find({ folderId: folder._id }).populate('uploadedBy', 'name email').sort({ createdAt: -1 });
    return NextResponse.json({ files });
  } catch (error: any) {
    console.error('GET /api/capstone/marks-files error:', error);
    return NextResponse.json({ error: 'Failed to fetch marks files' }, { status: 500 });
  }
}
