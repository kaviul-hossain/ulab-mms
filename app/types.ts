export interface Student {
  id: string;
  name: string;
  marks: { [examId: string]: number }; // Raw marks entered (unscaled)
  weightedMarks?: { [examId: string]: number }; // Weighted marks based on exam weightage
}

export interface Exam {
  id: string;
  name: string;
  totalMarks: number;
  weightage: number;
}

export interface MarksData {
  students: Student[];
  exams: Exam[];
}
