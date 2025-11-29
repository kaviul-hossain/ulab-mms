import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import dbConnect from '@/lib/mongodb';
import { getGridFSBucket } from '@/lib/gridfs';
import File from '@/models/File';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await dbConnect();

    const file = await File.findById(id);

    if (!file) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }

    // Download from GridFS
    const gridFSBucket = getGridFSBucket();
    const downloadStream = gridFSBucket.openDownloadStream(file.gridfsId);

    return new NextResponse(downloadStream as any, {
      status: 200,
      headers: {
        'Content-Type': file.mimeType,
        'Content-Disposition': `attachment; filename="${file.originalName}"`,
      },
    });
  } catch (error: any) {
    console.error('File download error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await dbConnect();

    const file = await File.findById(id);

    if (!file) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }

    // Check if user is the uploader or an admin
    if (file.uploadedBy.toString() !== token.id) {
      return NextResponse.json(
        { error: 'You can only delete files you uploaded' },
        { status: 403 }
      );
    }

    // Delete from GridFS
    const gridFSBucket = getGridFSBucket();
    await gridFSBucket.delete(file.gridfsId);

    // Delete file metadata
    await File.findByIdAndDelete(id);

    return NextResponse.json(
      { message: 'File deleted successfully' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('File deletion error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
