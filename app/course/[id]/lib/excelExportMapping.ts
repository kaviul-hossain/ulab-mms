export type ExcelExportField =
  | 'course.code'
  | 'course.name'
  | 'course.section'
  | 'course.semesterYear'
  | 'course.credit'
  | 'instructor'
  | 'student.name'
  | 'student.studentId'
  | 'mark.attendance'
  | 'mark.classPerformance'
  | 'mark.quiz'
  | 'mark.assignment'
  | 'mark.midterm'
  | 'mark.project'
  | 'mark.final'
  | 'weight.attendance'
  | 'weight.classPerformance'
  | 'weight.quiz'
  | 'weight.assignment'
  | 'weight.midterm'
  | 'weight.project'
  | 'weight.final';

export interface ExcelExportSingleCellMapping {
  field: ExcelExportField;
  cell: string;
}

export interface ExcelExportRangeMapping {
  field: ExcelExportField;
  from: string;
  to: string;
}

export interface ExcelExportMapping {
  sheetName?: string;
  singleCells?: ExcelExportSingleCellMapping[];
  rangeMappings?: ExcelExportRangeMapping[];
}

export const EXCEL_EXPORT_FIELD_OPTIONS: Array<{ label: string; value: ExcelExportField }> = [
  { label: 'Course Code', value: 'course.code' },
  { label: 'Course Title', value: 'course.name' },
  { label: 'Course Section', value: 'course.section' },
  { label: 'Semester (e.g. Summer 2026)', value: 'course.semesterYear' },
  { label: 'Credit', value: 'course.credit' },
  { label: 'Instructor', value: 'instructor' },
  { label: 'Student Name', value: 'student.name' },
  { label: 'Student ID', value: 'student.studentId' },
  { label: 'Attendance Mark', value: 'mark.attendance' },
  { label: 'Class Performance Mark', value: 'mark.classPerformance' },
  { label: 'Quiz Mark', value: 'mark.quiz' },
  { label: 'Assignment Mark', value: 'mark.assignment' },
  { label: 'Mid Exam Mark', value: 'mark.midterm' },
  { label: 'Project Mark', value: 'mark.project' },
  { label: 'Final Exam Mark', value: 'mark.final' },
];

export const DEFAULT_EXCEL_EXPORT_MAPPING: ExcelExportMapping = {
  sheetName: 'GradeSheet',
  singleCells: [
    { field: 'course.code', cell: 'H2' },
    { field: 'course.name', cell: 'H3' },
    { field: 'course.credit', cell: 'H4' },
    { field: 'instructor', cell: 'H5' },
    { field: 'course.section', cell: 'L2' },
    { field: 'course.semesterYear', cell: 'L3' },
    { field: 'weight.attendance', cell: 'C55' },
    { field: 'weight.classPerformance', cell: 'C56' },
    { field: 'weight.quiz', cell: 'C57' },
    { field: 'weight.assignment', cell: 'C58' },
    { field: 'weight.midterm', cell: 'C59' },
    { field: 'weight.project', cell: 'C60' },
    { field: 'weight.final', cell: 'C61' },
  ],
  rangeMappings: [
    { field: 'student.studentId', from: 'X10', to: 'X51' },
    { field: 'student.name', from: 'W10', to: 'W51' },
    { field: 'mark.attendance', from: 'P10', to: 'P51' },
    { field: 'mark.classPerformance', from: 'Q10', to: 'Q51' },
    { field: 'mark.quiz', from: 'R10', to: 'R51' },
    { field: 'mark.assignment', from: 'S10', to: 'S51' },
    { field: 'mark.midterm', from: 'T10', to: 'T51' },
    { field: 'mark.project', from: 'U10', to: 'U51' },
    { field: 'mark.final', from: 'V10', to: 'V51' },
  ],
};
