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

function resolvePath(ctx: any, expr: string) {
  if (!expr) return '';
  // simple dot path resolution, supports marks.<examId>
  const parts = expr.split('.');
  let cur: any = ctx;

  for (const part of parts) {
    if (part.startsWith('marks[') && part.endsWith(']')) {
      // marks[examId]
      const examId = part.slice(6, -1);
      cur = (ctx.marks || []).find((m: any) => m.examId.toString() === examId.toString());
    } else if (part === 'marks') {
      cur = ctx.marks;
    } else if (cur && Object.prototype.hasOwnProperty.call(cur, part)) {
      cur = cur[part];
    } else {
      cur = undefined;
    }
  }

  return cur === undefined || cur === null ? '' : cur;
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

    const students = await Student.find({ courseId });
    const exams = await Exam.find({ courseId });
    const marks = await Mark.find({ courseId });

    const body = await request.json().catch(() => ({}));
    const mapping = body.mapping || {};

    // Use public/templates so the file persists across builds
    const templatePath = path.join(process.cwd(), 'public', 'templates', 'Sample CO PO.xlsx');
    if (!fs.existsSync(templatePath)) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    // Load workbook using xlsx-populate to preserve styles/formatting
    const workbook = await XlsxPopulate.fromFileAsync(templatePath);

    // If mapping is empty, just return the template file unchanged
    const hasMapping = mapping && (Object.keys(mapping.cells || {}).length > 0 || mapping.rows);

    if (hasMapping) {
      // Get sheet by name if provided in mapping, otherwise use "GradeSheet"
      const sheet = workbook.sheet(mapping.sheet || 'GradeSheet');

      // Build context with special computed fields for cell mapping
      const context: any = {
        course,
        students,
        exams,
        marks,
        instructor: session.user?.name || '',
        credit: course.courseType === 'Theory' ? 3 : 1,
        semesterYear: `${course.semester} ${course.year}`,
      };

      // Apply single cell mappings
      if (mapping.cells) {
        for (const cellAddr of Object.keys(mapping.cells)) {
          const expr = mapping.cells[cellAddr];
          let value: any = '';

          if (expr.startsWith('course.')) {
            const field = expr.split('.')[1];
            value = (course as any)[field] ?? '';
          } else if (expr === 'instructor') {
            value = session.user?.name || '';
          } else if (expr === 'credit') {
            value = course.courseType === 'Theory' ? 3 : 1;
          } else if (expr === 'semesterYear') {
            value = `${course.semester} ${course.year}`;
          } else {
            value = resolvePath(context, expr);
          }

          sheet.cell(cellAddr).value(value === undefined || value === null ? '' : value);
        }
      }

      // Apply row mappings
      if (mapping.rows) {
        const startRow = mapping.rows.startRow || 2;
        const columns = mapping.rows.columns || {};

        let rowIndex = startRow;
        for (const student of students) {
          for (const col of Object.keys(columns)) {
            const expr = columns[col];
            let val: any = '';

            if (expr.startsWith('marks.')) {
              const examId = expr.split('.')[1];
              const m = marks.find((mk: any) => mk.examId.toString() === examId.toString() && mk.studentId.toString() === student._id.toString());
              val = m ? (m.rawMark ?? '') : '';
            } else if (expr.startsWith('student.')) {
              const field = expr.split('.')[1];
              val = (student as any)[field] ?? '';
            } else if (expr.startsWith('course.')) {
              const field = expr.split('.')[1];
              val = (course as any)[field] ?? '';
            }

            const cellAddr = `${col}${rowIndex}`;
            sheet.cell(cellAddr).value(val === undefined || val === null ? '' : val);
          }

          rowIndex++;
        }
      }
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
