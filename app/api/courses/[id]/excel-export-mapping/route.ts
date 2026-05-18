import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/mongodb';
import Course from '@/models/Course';
import { DEFAULT_EXCEL_EXPORT_MAPPING, type ExcelExportMapping } from '@/app/course/[id]/lib/excelExportMapping';

function normalizeMapping(mapping: any): ExcelExportMapping {
  if (!mapping) return DEFAULT_EXCEL_EXPORT_MAPPING;

  if (mapping.singleCells || mapping.rangeMappings) {
    return {
      sheetName: mapping.sheetName || 'GradeSheet',
      singleCells: Array.isArray(mapping.singleCells) ? mapping.singleCells : [],
      rangeMappings: Array.isArray(mapping.rangeMappings) ? mapping.rangeMappings : [],
    };
  }

  return DEFAULT_EXCEL_EXPORT_MAPPING;
}

export async function GET(
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

    const course = await Course.findOne({ _id: id, userId: session.user.id });
    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    return NextResponse.json({ mapping: normalizeMapping(course.excelExportMapping) }, { status: 200 });
  } catch (error) {
    console.error('Get excel export mapping error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

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
    const body = await request.json().catch(() => ({}));
    const mapping = normalizeMapping(body.mapping);

    await dbConnect();

    const course = await Course.findOne({ _id: id, userId: session.user.id });
    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    course.excelExportMapping = mapping;
    await course.save();

    return NextResponse.json({ mapping }, { status: 200 });
  } catch (error) {
    console.error('Save excel export mapping error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
