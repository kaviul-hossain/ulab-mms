import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/mongodb';
import ProjectGroup from '@/models/ProjectGroup';
import Course from '@/models/Course';
import Student from '@/models/Student';
import Exam from '@/models/Exam';

export async function GET(
  _req: NextRequest,
  { params }: { params: any }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const course = await Course.findOne({ _id: id, userId: session.user.id });
    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    const projectGroup = await ProjectGroup.findOne({ courseId: id });
    const projectExams = await Exam.find({ courseId: id, examCategory: 'Project' });

    const groups = projectGroup?.groups || [];

    const allStudentIds = groups.flatMap((g: any) => g.studentIds);
    const studentDocs = await Student.find({ _id: { $in: allStudentIds } }).select('name studentId _id');
    const studentMap = new Map(studentDocs.map((s: any) => [s._id.toString(), s]));

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<title>Simple Marking Grid — ${course.code} ${course.name}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: Arial, sans-serif; font-size: 12px; color: #111; padding: 24px; }
  .page-break { page-break-after: always; }
  h1 { font-size: 18px; font-weight: bold; margin-bottom: 4px; border-bottom: 2px solid #111; padding-bottom: 8px; }
  h2 { font-size: 15px; font-weight: bold; margin-bottom: 12px; margin-top: 24px; color: #333; }
  .subtitle { font-size: 12px; color: #555; margin-bottom: 24px; }
  
  .group-container { margin-bottom: 32px; page-break-inside: avoid; }
  .group-header { background: #f8fafc; padding: 12px; border: 1px solid #cbd5e1; border-bottom: none; border-radius: 6px 6px 0 0; }
  .group-title { font-size: 14px; font-weight: bold; margin-bottom: 4px; }
  .project-title { font-size: 13px; color: #444; }
  
  table { width: 100%; border-collapse: collapse; }
  th, td { border: 1px solid #cbd5e1; padding: 10px; text-align: left; }
  th { background: #f1f5f9; font-weight: bold; font-size: 12px; }
  
  .marks-col { width: 120px; text-align: center; }
</style>
</head>
<body>

<h1>${course.code} — ${course.name}</h1>
<div class="subtitle">Individual Marking Grid • Semester: ${course.semester} ${course.year}</div>

${projectExams.map((exam: any, eIndex: number) => `
  <div class="${eIndex > 0 ? 'page-break' : ''}">
    <h2>${exam.displayName} (Total Marks: ${exam.totalMarks})</h2>
    
    ${groups.length === 0 ? '<p>No groups created yet.</p>' : groups.map((group: any) => `
      <div class="group-container">
        <div class="group-header">
          <div class="group-title">Group ${group.groupNumber}</div>
          <div class="project-title">Project: <strong>${group.projectTitle || '__________________________________________________'}</strong></div>
        </div>
        <table>
          <thead>
            <tr>
              <th style="width: 120px;">Student ID</th>
              <th>Student Name</th>
              <th class="marks-col">Marks / ${exam.totalMarks}</th>
            </tr>
          </thead>
          <tbody>
            ${group.studentIds.map((sid: any) => {
              const s = studentMap.get(sid.toString());
              if (!s) return '';
              return `
                <tr>
                  <td style="font-family: monospace;">${s.studentId}</td>
                  <td>${s.name}</td>
                  <td></td>
                </tr>
              `;
            }).join('')}
            ${group.studentIds.length === 0 ? `
                <tr>
                  <td colspan="3" style="text-align:center; color:#888; font-style:italic;">No members assigned</td>
                </tr>
            ` : ''}
          </tbody>
        </table>
      </div>
    `).join('')}
  </div>
`).join('')}

${projectExams.length === 0 ? '<p>No project exams found.</p>' : ''}

<script>window.print();</script>
</body>
</html>`;

    return new NextResponse(html, {
      headers: { 'Content-Type': 'text/html' },
    });
  } catch (error: any) {
    console.error('Export Simple PDF Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
