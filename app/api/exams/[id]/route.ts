import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/mongodb';
import Exam from '@/models/Exam';

// PUT - Update exam settings
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { displayName, weightage, scalingEnabled, numberOfCOs, totalMarks } =
      await request.json();

    await dbConnect();

    const updateData: any = {};

    // Update displayName if provided
    if (displayName !== undefined) {
      updateData.displayName = displayName;
    }

    // Update weightage if provided (0-100)
    if (weightage !== undefined) {
      if (weightage < 0 || weightage > 100) {
        return NextResponse.json(
          { error: 'Weightage must be between 0 and 100' },
          { status: 400 }
        );
      }
      updateData.weightage = weightage;
    }

    // Update scalingEnabled if provided
    if (scalingEnabled !== undefined) {
      updateData.scalingEnabled = scalingEnabled;
    }

    // Update numberOfCOs if provided
    if (numberOfCOs !== undefined) {
      if (numberOfCOs < 0 || numberOfCOs > 10) {
        return NextResponse.json(
          { error: 'Number of COs must be between 0 and 10' },
          { status: 400 }
        );
      }
      updateData.numberOfCOs = numberOfCOs;
    }

    // Update totalMarks if provided
    if (totalMarks !== undefined) {
      if (totalMarks <= 0) {
        return NextResponse.json(
          { error: 'Total marks must be greater than 0' },
          { status: 400 }
        );
      }
      updateData.totalMarks = totalMarks;
    }

    const exam = await Exam.findOneAndUpdate(
      { _id: id, userId: session.user.id },
      updateData,
      { new: true, runValidators: true }
    );

    if (!exam) {
      return NextResponse.json({ error: 'Exam not found' }, { status: 404 });
    }

    return NextResponse.json({ exam }, { status: 200 });
  } catch (error: any) {
    console.error('Update exam error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete an exam (only custom exams can be deleted)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    await dbConnect();

    const exam = await Exam.findOne({ _id: id, userId: session.user.id });

    if (!exam) {
      return NextResponse.json({ error: 'Exam not found' }, { status: 404 });
    }

    // Only allow deletion of custom (non-required) exams
    if (exam.isRequired) {
      return NextResponse.json(
        { error: 'Cannot delete required exams' },
        { status: 400 }
      );
    }

    await Exam.findByIdAndDelete(id);

    return NextResponse.json(
      { message: 'Exam deleted successfully' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Delete exam error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
