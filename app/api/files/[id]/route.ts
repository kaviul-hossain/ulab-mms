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

    // Verify admin password via request header
    const adminPassword = request.headers.get('x-admin-password');
    const expectedPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'Admin@123';
    const isAdmin = adminPassword === expectedPassword;

    // Only the uploader or admin can delete the file
    if (file.uploadedBy.toString() !== token.id && !isAdmin) {
      return NextResponse.json(
        { error: 'You do not have permission to delete this file' },
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
