import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import dbConnect from '@/lib/mongodb';
import AdminSettings from '@/models/AdminSettings';
import bcrypt from 'bcryptjs';

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

    const { password } = await request.json();

    if (!password) {
      return NextResponse.json(
        { error: 'Password is required' },
        { status: 400 }
      );
    }

    // Get the admin password from database
    const adminSettings = await AdminSettings.findOne();

    if (!adminSettings) {
      return NextResponse.json(
        { error: 'Admin settings not configured' },
        { status: 500 }
      );
    }

    // Compare password with hash
    const isPasswordValid = await bcrypt.compare(password, adminSettings.passwordHash);

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid admin password' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { message: 'Admin password verified successfully' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Admin verification error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
