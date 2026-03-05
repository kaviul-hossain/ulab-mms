import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';

// GET all users for dropdown selection (supervisors, evaluators)
export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    // Fetch all users with basic info needed for supervisor/evaluator selection
    const users = await User.find({}, 'name email _id')
      .sort({ name: 1 });

    return NextResponse.json(users, { status: 200 });
  } catch (error: any) {
    console.error('Get users error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
