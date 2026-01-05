import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import dbConnect from '@/lib/mongodb';
import { getGridFSBucket } from '@/lib/gridfs';
import File from '@/models/File';
import User from '@/models/User';
import { v4 as uuidv4 } from 'uuid';

const ALLOWED_TYPES = ['application/pdf', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export async function POST(request: NextRequest) {
  try {
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

    // Check if user is admin
    const user = await User.findById(token.id);
    if (!user || !user.isAdmin) {
      return NextResponse.json(
        { error: 'Only admins can upload files' },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const folderId = formData.get('folderId') as string;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate folder if provided
    let folderPath = '/';
    let parentFolderId = null;
    if (folderId) {
      const folder = await File.findById(folderId);
      if (!folder || !folder.isFolder) {
        return NextResponse.json(
          { error: 'Invalid folder' },
          { status: 400 }
        );
      }
      folderPath = `${folder.folderPath}${folder.originalName}/`;
      parentFolderId = folderId;
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only PDF, Excel, and Word documents are allowed' },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File size exceeds 50MB limit' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const fileBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(fileBuffer);

    // Upload to GridFS
    const gridFSBucket = getGridFSBucket();
    const uploadStream = gridFSBucket.openUploadStream(uuidv4(), {
      contentType: file.type,
    });

    const gridfsId = uploadStream.id;

    await new Promise((resolve, reject) => {
      uploadStream.on('finish', resolve);
      uploadStream.on('error', reject);
      uploadStream.write(buffer);
      uploadStream.end();
    });

    // Generate unique filename for metadata
    const fileExtension = file.name.split('.').pop();
    const uniqueFilename = `${uuidv4()}.${fileExtension}`;

    // Save file metadata to database
    const savedFile = await File.create({
      filename: uniqueFilename,
      originalName: file.name,
      mimeType: file.type,
      size: file.size,
      uploadedBy: token.id,
      gridfsId: gridfsId,
      isFolder: false,
      parentFolderId: parentFolderId,
      folderPath: folderPath,
    });

    return NextResponse.json(
      {
        message: 'File uploaded successfully',
        file: {
          id: savedFile._id,
          originalName: savedFile.originalName,
          size: savedFile.size,
          uploadedAt: savedFile.uploadedAt,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('File upload error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
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

    const { searchParams } = new URL(request.url);
    const folderId = searchParams.get('folderId');
    const includeAllFiles = searchParams.get('includeAll') === 'true';

    let files: any[] = [];

    if (includeAllFiles) {
      // Get all files (for backward compatibility)
      files = await File.find({ isFolder: false })
        .select('-gridfsId')
        .populate('uploadedBy', 'name email')
        .sort({ uploadedAt: -1 });
    } else {
      // Get files in specific folder
      const query: any = { isFolder: false };
      if (folderId) {
        query.parentFolderId = folderId;
      } else {
        query.parentFolderId = null;
      }

      files = await File.find(query)
        .select('-gridfsId')
        .populate('uploadedBy', 'name email')
        .sort({ uploadedAt: -1 });
    }

    return NextResponse.json(
      {
        files: files.map((f: any) => ({
          id: f._id,
          originalName: f.originalName,
          mimeType: f.mimeType,
          size: f.size,
          uploadedBy: f.uploadedBy?.name || 'Unknown',
          uploadedAt: f.uploadedAt,
          parentFolderId: f.parentFolderId,
        })),
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('File fetch error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
