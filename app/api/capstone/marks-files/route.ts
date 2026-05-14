import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { ResourceFolder } from '@/models/ResourceFolder';
import { StoredFile } from '@/models/StoredFile';

export async function GET(req: NextRequest) {
  try {
    await dbConnect();

    // Find Capstone Marks folder
    const folder = await ResourceFolder.findOne({ name: 'Capstone Marks', parentId: null });

    if (!folder) {
      return NextResponse.json({ files: [] }, { status: 200 });
    }

    // Get all files in the Capstone Marks folder
    const files = await StoredFile.find({ folderId: folder._id })
      .populate('uploadedBy', 'name email')
      .sort({ createdAt: -1 });

    return NextResponse.json({ files }, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching marks files:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch marks files' },
      { status: 500 }
    );
  }
}
