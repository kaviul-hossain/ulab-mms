/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/mongodb';
import Course from '@/models/Course';
import Student from '@/models/Student';
import Exam from '@/models/Exam';
import Mark from '@/models/Mark';
import fs from 'fs';
import path from 'path';
import XlsxPopulate from 'xlsx-populate';
import {
  DEFAULT_EXCEL_EXPORT_MAPPING,
  type ExcelExportField,
  type ExcelExportMapping,
} from '@/app/course/[id]/lib/excelExportMapping';

function normalizeMapping(mapping: any): ExcelExportMapping {
  if (!mapping) return DEFAULT_EXCEL_EXPORT_MAPPING;

  return {
    sheetName: mapping.sheetName || 'GradeSheet',
    singleCells: Array.isArray(mapping.singleCells) ? mapping.singleCells : DEFAULT_EXCEL_EXPORT_MAPPING.singleCells || [],
    rangeMappings: Array.isArray(mapping.rangeMappings) ? mapping.rangeMappings : DEFAULT_EXCEL_EXPORT_MAPPING.rangeMappings || [],
  };
}

function parseCellAddress(cell: string) {
  const match = /^([A-Z]+)(\d+)$/i.exec(cell.trim());
  if (!match) return null;
  return { column: match[1].toUpperCase(), row: Number(match[2]) };
}

function resolveFieldValue(field: ExcelExportField, course: any, student: any, instructorName: string) {
  switch (field) {
    case 'course.code':
      return course.code || '';
    case 'course.name':
      return course.name || '';
    case 'course.section':
      return course.section || '';
    case 'course.semesterYear':
      return `${course.semester} ${course.year}`.trim();
    case 'course.credit':
      return course.courseType === 'Theory' ? 3 : 1;
    case 'instructor':
      return instructorName || '';
    case 'student.name':
      return student?.name || '';
    case 'student.studentId':
      return student?.studentId || '';
    default:
      return '';
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: courseId } = await params;

    await dbConnect();

    const course = await Course.findOne({ _id: courseId, userId: session.user.id });

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    const students = await Student.find({ courseId })
      .sort({ studentId: 1, _id: 1 })
      .collation({ locale: 'en', numericOrdering: true });
    const exams = await Exam.find({ courseId });
    const marks = await Mark.find({ courseId });

    const body = await request.json().catch(() => ({}));
    const mapping = normalizeMapping(body.mapping || course.excelExportMapping);

    // Use public/templates so the file persists across builds
    const templatePath = path.join(process.cwd(), 'public', 'templates', 'Sample CO PO.xlsx');
    if (!fs.existsSync(templatePath)) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    // Load workbook using xlsx-populate to preserve styles/formatting
    const workbook = await XlsxPopulate.fromFileAsync(templatePath);

    const sheet = workbook.sheet(mapping.sheetName || 'GradeSheet');
    const instructorName = session.user?.name || '';

    for (const singleCell of mapping.singleCells || []) {
      const value = resolveFieldValue(singleCell.field, course, null, instructorName);
      sheet.cell(singleCell.cell).value(value === undefined || value === null ? '' : value);
    }

    for (const rangeMapping of mapping.rangeMappings || []) {
      const fromCell = parseCellAddress(rangeMapping.from);
      const toCell = parseCellAddress(rangeMapping.to);

      if (!fromCell || !toCell || fromCell.column !== toCell.column) {
        continue;
      }

      const maxRows = Math.max(0, toCell.row - fromCell.row + 1);
      const targetStudents = students.slice(0, maxRows);

      targetStudents.forEach((student, index) => {
        const row = fromCell.row + index;
        const value = resolveFieldValue(rangeMapping.field, course, student, instructorName);
        sheet.cell(`${fromCell.column}${row}`).value(value === undefined || value === null ? '' : value);
      });
    }

    const outBuf = await workbook.outputAsync();

    return new NextResponse(outBuf, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${course.code}_${course.name}_course_file_${new Date().toISOString().split('T')[0]}.xlsx"`,
      },
    });
  } catch (error) {
    console.error('Export file error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
