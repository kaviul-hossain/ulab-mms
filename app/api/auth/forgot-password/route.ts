import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    await dbConnect();

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      // Don't reveal if email exists or not for security, but don't send email
      console.log('Password reset requested for non-existent email:', email.toLowerCase());
      return NextResponse.json(
        { message: 'If an account exists with this email, a reset link has been sent.' },
        { status: 200 }
      );
    }

    console.log('Password reset requested for registered user:', user.email);

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
    const resetTokenExpiry = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

    console.log('=== Generating Reset Token ===');
    console.log('Plain token:', resetToken);
    console.log('Token hash:', resetTokenHash);
    console.log('Expiry:', resetTokenExpiry);

    // Save reset token to user
    user.passwordResetToken = resetTokenHash;
    user.passwordResetTokenExpiry = resetTokenExpiry;
    await user.save();

    console.log('Token saved to database');
    console.log('Verifying save...');
    const savedUser = await User.findOne({ email: user.email.toLowerCase() });
    console.log('Saved token hash in DB:', savedUser?.passwordResetToken?.substring(0, 20) + '...');
    console.log('Match?', savedUser?.passwordResetToken === resetTokenHash);

    // Create reset link - use user.email from database to ensure consistency
    const resetLink = `${process.env.NEXTAUTH_URL}/auth/reset-password?token=${resetToken}&email=${encodeURIComponent(user.email)}`;

    // Try to send email if credentials are configured
    if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
      try {
        const nodemailer = require('nodemailer');
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD,
          },
          connectionUrl: 'smtps://smtp.gmail.com',
        });

        // Verify connection
        await transporter.verify();
        console.log('SMTP connection verified successfully');

        const mailOptions = {
          from: process.env.EMAIL_USER,
          to: user.email,
          subject: 'Password Reset Request - Marks Management System',
          html: `
            <h2>Password Reset Request</h2>
            <p>You have requested to reset your password. Click the link below to proceed:</p>
            <p>
              <a href="${resetLink}" style="background-color: #3b82f6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Reset Password
              </a>
            </p>
            <p>Or copy and paste this link in your browser:</p>
            <p>${resetLink}</p>
            <p>This link will expire in 30 minutes.</p>
            <p>If you did not request this, please ignore this email.</p>
          `,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent successfully:', info.response);
      } catch (emailError: any) {
        console.error('Email sending failed:', emailError.message || emailError);
        console.error('Full error:', emailError);
        // Still return success even if email fails, as the token is saved
      }
    } else {
      // Log the reset link if email is not configured (for development)
      console.log('Reset Link (email not configured):', resetLink);
    }

    return NextResponse.json(
      { message: 'If an account exists with this email, a reset link has been sent.' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process reset request' },
      { status: 500 }
    );
  }
}
