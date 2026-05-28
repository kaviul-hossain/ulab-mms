'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { BookOpen, FlaskConical, Upload, Download, Plus, ClipboardList, AlertTriangle } from 'lucide-react';

interface Course {
  _id: string;
  name: string;
  code: string;
  semester: string;
  year: number;
  courseType: 'Theory' | 'Lab';
  showFinalGrade: boolean;
  quizWeightage?: number | string;
  assignmentWeightage?: number | string;
  projectWeightage?: number | string;
}

interface OverviewViewProps {
  course: Course;
  students: any[];
  exams: any[];
  marks: any[];
  onImportStudents: () => void;
  onAddExam: () => void;
  onImportCourse: () => void;
  onExportCSV: () => void;
  exportingCSV: boolean;
  onExportCourseFile?: () => void;
  exportingCourseFile?: boolean;
}

export default function OverviewView({
  course,
  students,
  exams,
  marks,
  onImportStudents,
  onAddExam,
  onImportCourse,
  onExportCSV,
  exportingCSV,
  onExportCourseFile,
  exportingCourseFile,
}: OverviewViewProps) {
  const [showExportDisclaimer, setShowExportDisclaimer] = useState(false);
  const [showChecklist, setShowChecklist] = useState(false);

  const hasQuizzes = exams.some(exam => exam.examCategory === 'Quiz');
  const hasAssignments = exams.some(exam => exam.examCategory === 'Assignment');
  const hasProjects = exams.some(exam => exam.examCategory === 'Project');

  let totalWeightage = exams.reduce((sum, exam) => {
    if (exam.examCategory === 'Quiz' || exam.examCategory === 'Assignment' || exam.examCategory === 'Project') {
      return sum; // these are handled at course level below
    }
    return sum + (Number(exam.weightage) || 0);
  }, 0);

  if (hasQuizzes && course.quizWeightage) {
    totalWeightage += Number(course.quizWeightage);
  }

  if (hasAssignments && course.assignmentWeightage) {
    totalWeightage += Number(course.assignmentWeightage);
  }

  if (hasProjects && course.projectWeightage) {
    totalWeightage += Number(course.projectWeightage);
  }

  const studentsWithMarks = students.filter(student => 
    marks.some(mark => mark.studentId === student._id)
  ).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Course Overview</h1>
        <p className="text-sm mt-1 text-muted-foreground">
          Manage your course structure and view statistics
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Students</CardTitle>
            <span className="text-2xl">👨‍🎓</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{students.length}</div>
            <p className="text-xs text-muted-foreground">
              {studentsWithMarks} with marks
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Exams</CardTitle>
            <span className="text-2xl">📝</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{exams.length}</div>
            <p className="text-xs text-muted-foreground">
              {totalWeightage}% total weightage
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Marks Recorded</CardTitle>
            <span className="text-2xl">✏️</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{marks.length}</div>
            <p className="text-xs text-muted-foreground">
              Total entries
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion</CardTitle>
            <span className="text-2xl">📊</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {students.length > 0 && exams.length > 0
                ? Math.round((marks.length / (students.length * exams.length)) * 100)
                : 0}%
            </div>
            <Progress 
              value={students.length > 0 && exams.length > 0
                ? (marks.length / (students.length * exams.length)) * 100
                : 0
              } 
              className="mt-2"
            />
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks and operations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <h3 className="text-sm font-semibold">Student Management</h3>
              <Button
                onClick={onImportStudents}
                variant="outline"
                className="w-full justify-start"
              >
                <Upload className="w-4 h-4 mr-2" />
                Import Students (CSV)
              </Button>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-semibold">Exam Management</h3>
              <Button
                onClick={onAddExam}
                variant="outline"
                className="w-full justify-start"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add New Exam
              </Button>
            </div>



            <div className="space-y-3">
              <h3 className="text-sm font-semibold">Course Data</h3>
              <div className="flex flex-col gap-2">
                <Button
                  onClick={onImportCourse}
                  variant="outline"
                  className="w-full justify-start"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Import Course Data
                </Button>
                <Button
                  onClick={onExportCSV}
                  disabled={exportingCSV}
                  variant="outline"
                  className="w-full justify-start"
                >
                  <Download className="w-4 h-4 mr-2" />
                  {exportingCSV ? 'Exporting...' : 'Export CSV'}
                </Button>
                <Button
                  onClick={() => setShowExportDisclaimer(true)}
                  disabled={exportingCourseFile}
                  variant="outline"
                  className="w-full justify-start"
                >
                  <Download className="w-4 h-4 mr-2" />
                  {exportingCourseFile ? 'Exporting...' : 'Export course file'}
                  <span className="ml-2 text-xs text-muted-foreground">Beta</span>
                </Button>
                <Button
                  onClick={() => setShowChecklist(true)}
                  variant="outline"
                  className="w-full justify-start"
                >
                  <ClipboardList className="w-4 h-4 mr-2" />
                  Course File Checklist
                </Button>
                <Button
                  onClick={() => {
                    const a = document.createElement('a');
                    a.href = '/templates/Sample CO PO.xlsx';
                    a.download = 'Empty_CO_PO_File.xlsx';
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                  }}
                  variant="outline"
                  className="w-full justify-start"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download empty CO PO File
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Course Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {course.courseType === 'Theory' ? (
              <BookOpen className="w-5 h-5" />
            ) : (
              <FlaskConical className="w-5 h-5" />
            )}
            Course Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-muted-foreground">Course Code</div>
              <div className="font-medium">{course.code}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Course Type</div>
              <Badge variant={course.courseType === 'Theory' ? 'default' : 'secondary'}>
                {course.courseType}
              </Badge>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Semester</div>
              <div className="font-medium">{course.semester}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Year</div>
              <div className="font-medium">{course.year}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Export Disclaimer Modal */}
      <Dialog open={showExportDisclaimer} onOpenChange={setShowExportDisclaimer}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center text-amber-500">
              <AlertTriangle className="w-5 h-5 mr-2" />
              Export Course File (Beta)
            </DialogTitle>
            <DialogDescription>
              Please read the following before exporting the course file:
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <ul className="list-disc pl-5 space-y-2 text-sm text-foreground">
              <li><strong>This feature is in Beta.</strong> Please double-check the generated file.</li>
              <li>It supports a maximum of <strong>42 students, 6 COs and 12 POs</strong>.</li>
              <li>It expects a predefined strict amount of exams for theory: <em>Attendance, Performance, Quiz, Assignment, Midterm Exam, Project, Final Exam</em>.</li>
              <li>It may malfunction for <strong>Lab</strong> courses because labs often follow different structures than theory courses.</li>
            </ul>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowExportDisclaimer(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => {
                setShowExportDisclaimer(false);
                if (onExportCourseFile) onExportCourseFile();
              }}
              disabled={exportingCourseFile}
            >
              {exportingCourseFile ? 'Exporting...' : 'I Understand, Export'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Course File Checklist Modal */}
      <Dialog open={showChecklist} onOpenChange={setShowChecklist}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <ClipboardList className="w-5 h-5 mr-2 text-primary" />
              Course File Checklist
            </DialogTitle>
            <DialogDescription>
              List of documents needed for final course file submission.
              <br/>
              <strong>Instruction:</strong> Please submit soft copy in concerned Google Drive Folder and Hard copy to Dept. Admin Officer.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-2">
            {course.courseType === 'Lab' ? (
              <div className="space-y-4">
                <h4 className="font-semibold text-lg border-b pb-2">Lab Courses Requirements</h4>
                <ol className="list-decimal pl-5 space-y-2 text-sm">
                  <li>Course Outline - (Soft and Hard copy)</li>
                  <li>Attendances - (Hard copy)
                    <ul className="list-[lower-alpha] pl-5 mt-1 space-y-1 text-muted-foreground">
                      <li>Class Attendance</li>
                      <li>Mid Term Attendance</li>
                      <li>Final Term Attendance</li>
                    </ul>
                  </li>
                  <li>Final Grade Report - (Soft and Hard copy)</li>
                  <li>Marks Excel breakdown - (Soft and Hard copy)</li>
                  <li>List of Lab Tasks (for all Lab course) - (Soft and Hard copy)</li>
                  <li>Open-Ended Lab Form (for all Lab course) - (Soft and Hard copy)</li>
                  <li>Open-Ended Lab Report + Rubrics (Highest, Medium and Lowest) - (Hard copy)</li>
                  <li>Complex Engineering Project form (For Dominant Lab Courses) - (Soft and Hard copy)</li>
                  <li>Complex Engineering Project report + Rubrics (Highest, Medium and Lowest) (For Dominant Lab Courses) - (Hard copy)</li>
                  <li>CO-PO Excel file (including CO-PO attainment, Semester Course Report/Course Summary) – (Soft and Hard copy)</li>
                  <li>CQI Form</li>
                  <li>Excuse Absent Form</li>
                  <li>Class Summary Report</li>
                </ol>
              </div>
            ) : (
              <div className="space-y-4">
                <h4 className="font-semibold text-lg border-b pb-2">Theory Courses Requirements</h4>
                <ol className="list-decimal pl-5 space-y-2 text-sm">
                  <li>Course Outline (Soft and Hard copy)</li>
                  <li>Attendances (Hard copy)
                    <ul className="list-[lower-alpha] pl-5 mt-1 space-y-1 text-muted-foreground">
                      <li>Class Attendance</li>
                      <li>Mid Term Attendance</li>
                      <li>Final Term Attendance</li>
                    </ul>
                  </li>
                  <li>Mid Term Question Moderation, Mid Term Question and Sample Answer Scripts (Highest, Medium and Lowest) - (Hard copy)</li>
                  <li>Final Question Moderation, Final Question and Sample Answer Scripts (Highest, Medium and Lowest) - (Hard copy)</li>
                  <li>Final Grade Report - (Soft and Hard copy)</li>
                  <li>Marks Excel breakdown - (Soft and Hard copy)</li>
                  <li>Complex Engineering Project form (For Dominant Courses only) - (Hard copy)</li>
                  <li>Complex Engineering Project report+ Rubrics (Highest, Medium and Lowest) (For Dominant Courses only) - (Hard copy)</li>
                  <li>CO-PO Excel file (including CO-PO attainment, Semester Course Report/Course Summary) – (Soft and Hard copy)</li>
                  <li>CQI Form</li>
                  <li>Excuse Absent Form</li>
                  <li>Class Summary Report</li>
                </ol>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button onClick={() => setShowChecklist(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
