import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import dbConnect from '@/lib/mongodb';
import AdminSettings from '@/models/AdminSettings';
import bcrypt from 'bcryptjs';

/**
 * This endpoint is used to:
 * 1. Initialize the admin password on first setup
 * 2. Update the admin password
 * 
 * Should only be accessible during initial setup or by authenticated admins
 */
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

    const { password, currentPassword } = await request.json();

    if (!password) {
      return NextResponse.json(
        { error: 'New password is required' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    // Get existing admin settings
    let adminSettings = await AdminSettings.findOne();

    // If admin settings exist, verify current password
    if (adminSettings) {
      if (!currentPassword) {
        return NextResponse.json(
          { error: 'Current password is required to change the admin password' },
          { status: 400 }
        );
      }

      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, adminSettings.passwordHash);
      if (!isCurrentPasswordValid) {
        return NextResponse.json(
          { error: 'Current password is incorrect' },
          { status: 401 }
        );
      }
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update or create admin settings
    if (adminSettings) {
      adminSettings.passwordHash = hashedPassword;
      await adminSettings.save();
    } else {
      adminSettings = await AdminSettings.create({
        passwordHash: hashedPassword,
      });
    }

    return NextResponse.json(
      { message: 'Admin password updated successfully' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Admin settings error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint to check if admin password is initialized
 */
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

    const adminSettings = await AdminSettings.findOne();

    return NextResponse.json(
      {
        isInitialized: !!adminSettings,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Admin settings check error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
