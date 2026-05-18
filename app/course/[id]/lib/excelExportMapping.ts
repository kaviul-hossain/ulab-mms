export type ExcelExportField =
  | 'course.code'
  | 'course.name'
  | 'course.section'
  | 'course.semesterYear'
  | 'course.credit'
  | 'instructor'
  | 'student.name'
  | 'student.studentId';

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
  ],
  rangeMappings: [
    { field: 'student.name', from: 'V10', to: 'V51' },
    { field: 'student.studentId', from: 'W10', to: 'W51' },
  ],
};
