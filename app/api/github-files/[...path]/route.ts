import { NextRequest, NextResponse } from 'next/server';
import { getGitHubStorage } from '@/lib/github-storage';

/**
 * GET - Download a file from GitHub repository
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const resolvedParams = await params;
    const filePath = resolvedParams.path.join('/');
    
    const storage = getGitHubStorage();
    
    // Get file details first
    const fileInfo = await storage.getFile(filePath);
    
    // Download file content
    const buffer = await storage.downloadFile(filePath);

    // Determine content type from file extension
    const ext = filePath.split('.').pop()?.toLowerCase();
    const contentType = getContentType(ext || '');

    return new NextResponse(Buffer.from(buffer), {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${fileInfo.name}"`,
        'Content-Length': buffer.length.toString(),
      },
    });
  } catch (error: any) {
    console.error('Error downloading file:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Failed to download file' 
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Delete a file from GitHub repository
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const resolvedParams = await params;
    const filePath = resolvedParams.path.join('/');
    
    const storage = getGitHubStorage();
    await storage.deleteFile(filePath, `Delete ${filePath}`);

    return NextResponse.json({
      success: true,
      message: 'File deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting file:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Failed to delete file' 
      },
      { status: 500 }
    );
  }
}

/**
 * Helper function to get content type from file extension
 */
function getContentType(ext: string): string {
  const types: Record<string, string> = {
    pdf: 'application/pdf',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    txt: 'text/plain',
    csv: 'text/csv',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    zip: 'application/zip',
  };
  
  return types[ext] || 'application/octet-stream';
}
