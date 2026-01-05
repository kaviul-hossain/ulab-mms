import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import dbConnect from '@/lib/mongodb';
import File from '@/models/File';
import User from '@/models/User';
import { v4 as uuidv4 } from 'uuid';

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
        { error: 'Only admins can create folders' },
        { status: 403 }
      );
    }

    const { folderName, parentFolderId } = await request.json();

    if (!folderName || !folderName.trim()) {
      return NextResponse.json(
        { error: 'Folder name is required' },
        { status: 400 }
      );
    }

    // Validate folder name
    if (folderName.length > 100) {
      return NextResponse.json(
        { error: 'Folder name must be less than 100 characters' },
        { status: 400 }
      );
    }

    // If parentFolderId is provided, verify it exists and is a folder
    let folderPath = '/';
    if (parentFolderId) {
      const parentFolder = await File.findById(parentFolderId);
      if (!parentFolder || !parentFolder.isFolder) {
        return NextResponse.json(
          { error: 'Invalid parent folder' },
          { status: 400 }
        );
      }
      folderPath = `${parentFolder.folderPath}${parentFolder.originalName}/`;
    }

    // Create folder document
    const folder = await File.create({
      filename: uuidv4(),
      originalName: folderName.trim(),
      mimeType: 'application/x-folder',
      size: 0,
      uploadedBy: token.id,
      isFolder: true,
      parentFolderId: parentFolderId || null,
      folderPath: folderPath,
    });

    return NextResponse.json(
      {
        message: 'Folder created successfully',
        folder: {
          id: folder._id,
          name: folder.originalName,
          isFolder: true,
          parentFolderId: folder.parentFolderId,
          folderPath: folder.folderPath,
          createdAt: folder.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Folder creation error:', error);
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
    const parentFolderId = searchParams.get('parentFolderId');

    // Get folders at the specified level
    const query: any = { isFolder: true };
    
    if (parentFolderId) {
      query.parentFolderId = parentFolderId;
    } else {
      query.parentFolderId = null;
    }

    const folders = await File.find(query)
      .select('originalName parentFolderId folderPath createdAt')
      .populate('uploadedBy', 'name')
      .sort({ originalName: 1 });

    return NextResponse.json(
      {
        folders: folders.map((f: any) => ({
          id: f._id,
          name: f.originalName,
          parentFolderId: f.parentFolderId,
          folderPath: f.folderPath,
          createdAt: f.createdAt,
        })),
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Folder fetch error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
