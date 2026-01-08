import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import dbConnect from '@/lib/mongodb';
import { verifyAdminPassword } from '@/lib/admin';
import File from '@/models/File';
import User from '@/models/User';
import { getGridFSBucket } from '@/lib/gridfs';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ folderId: string }> }
) {
  try {
    const { folderId } = await params;
    
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

    // Verify admin password via request header
    const adminPassword = request.headers.get('x-admin-password');
    
    if (!adminPassword) {
      return NextResponse.json(
        { error: 'Admin password required to delete folders' },
        { status: 403 }
      );
    }

    const isValidPassword = await verifyAdminPassword(adminPassword);
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid admin password' },
        { status: 403 }
      );
    }

    // Verify folder exists and is actually a folder
    const folder = await File.findById(folderId);
    if (!folder || !folder.isFolder) {
      return NextResponse.json(
        { error: 'Folder not found' },
        { status: 404 }
      );
    }

    // Find all files and subfolders within this folder
    const deleteRecursive = async (parentId: any): Promise<number> => {
      let deletedCount = 0;

      // Find all items in this folder
      const items = await File.find({ parentFolderId: parentId });

      for (const item of items) {
        if (item.isFolder) {
          // Recursively delete subfolder contents
          deletedCount += await deleteRecursive(item._id);
          // Delete the subfolder
          await File.findByIdAndDelete(item._id);
          deletedCount++;
        } else {
          // Delete file from GridFS if it has gridfsId
          if (item.gridfsId) {
            try {
              const gridFSBucket = getGridFSBucket();
              await gridFSBucket.delete(item.gridfsId);
            } catch (err) {
              console.error('Error deleting from GridFS:', err);
            }
          }
          // Delete file metadata
          await File.findByIdAndDelete(item._id);
          deletedCount++;
        }
      }

      return deletedCount;
    };

    // Delete all contents recursively
    const deletedItems = await deleteRecursive(folderId);

    // Delete the folder itself
    await File.findByIdAndDelete(folderId);

    return NextResponse.json(
      {
        message: 'Folder and all its contents deleted successfully',
        deletedCount: deletedItems + 1,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Folder deletion error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
