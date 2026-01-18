import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { isValidEmail } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    const { token, email, newPassword, confirmPassword } = await request.json();

    if (!token || !email || !newPassword || !confirmPassword) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate email format
    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { error: 'Passwords do not match' },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    await dbConnect();

    // Hash the token to compare with stored hash
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const normalizedEmail = email.toLowerCase().trim();

    console.log('=== Reset Password Debug Info ===');
    console.log('Received plain token:', token);
    console.log('Calculated hash:', tokenHash);
    console.log('Received email:', normalizedEmail);
    console.log('Token length:', token.length);

    // Verify that the user exists and has a valid reset token
    const user = await User.findOne({
      email: normalizedEmail,
      passwordResetToken: tokenHash,
      passwordResetTokenExpiry: { $gt: new Date() },
    });

    if (!user) {
      // Debug why it failed
      const userByEmail = await User.findOne({ email: normalizedEmail });
      if (userByEmail) {
        console.log('User exists:', userByEmail.name);
        console.log('User has reset token:', !!userByEmail.passwordResetToken);
        if (userByEmail.passwordResetToken) {
          console.log('Stored token hash:', userByEmail.passwordResetToken.substring(0, 20) + '...');
          console.log('Stored token length:', userByEmail.passwordResetToken.length);
          console.log('Calculated token hash:', tokenHash.substring(0, 20) + '...');
          console.log('Calculated token length:', tokenHash.length);
          console.log('Hashes match?:', userByEmail.passwordResetToken === tokenHash);
        }
        console.log('Token expiry:', userByEmail.passwordResetTokenExpiry);
        console.log('Current time:', new Date());
        if (userByEmail.passwordResetTokenExpiry) {
          console.log('Token expired?:', userByEmail.passwordResetTokenExpiry <= new Date());
        }
      } else {
        console.log('User not found with email:', normalizedEmail);
      }
    }

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid or expired reset token' },
        { status: 400 }
      );
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password and clear reset token
    user.password = hashedPassword;
    user.passwordResetToken = null;
    user.passwordResetTokenExpiry = null;
    await user.save();

    console.log('Password reset successful for user:', user.email);
    return NextResponse.json(
      { message: 'Password has been reset successfully' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Reset password error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to reset password' },
      { status: 500 }
    );
  }
}
