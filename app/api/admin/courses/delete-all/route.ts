import { NextResponse, type NextRequest } from 'next/server';
import connectDB from '@/lib/mongodb';
import AdminCourse from '@/models/AdminCourse';
import { verifyAdminToken } from '@/lib/adminAuth';

export async function DELETE(request: NextRequest) {
  try {
    // Verify admin authentication
    const adminEmail = await verifyAdminToken(request);
    if (!adminEmail) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    await connectDB();

    // Count courses before deletion
    const count = await AdminCourse.countDocuments();

    // Delete all courses
    await AdminCourse.deleteMany({});

    return NextResponse.json({
      success: true,
      message: 'All courses deleted successfully',
      count,
    });
  } catch (error) {
    console.error('Delete all courses error:', error);
    return NextResponse.json(
      { error: 'Failed to delete courses' },
      { status: 500 }
    );
  }
}
