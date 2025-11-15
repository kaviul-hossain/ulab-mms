'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface Student {
  _id: string;
  studentId: string;
  name: string;
}

interface Course {
  _id: string;
  name: string;
  code: string;
  semester: string;
  year: number;
  courseType: 'Theory' | 'Lab';
  showFinalGrade: boolean;
}

interface Exam {
  _id: string;
  displayName: string;
  totalMarks: number;
  weightage: number;
  scalingEnabled: boolean;
  scalingMethod?: string;
  examType: string;
  numberOfCOs?: number;
}

interface Mark {
  _id: string;
  examId: string;
  rawMark: number;
  coMarks?: number[];
  scaledMark?: number;
  roundedMark?: number;
}

interface CourseData {
  student: Student;
  course: Course;
  exams: Exam[];
  marks: Mark[];
}

export default function StudentCheckMarks() {
  const [studentId, setStudentId] = useState('');
  const [studentName, setStudentName] = useState('');
  const [courses, setCourses] = useState<CourseData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<CourseData | null>(null);
  const [showCourseModal, setShowCourseModal] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setSearched(false);
    setCourses([]);

    try {
      const response = await fetch(`/api/student/marks?studentId=${encodeURIComponent(studentId)}`);
      const data = await response.json();

      if (response.ok) {
        setCourses(data.courses);
        setStudentName(data.studentName);
        setSearched(true);
      } else {
        setError(data.error || 'Student ID not found');
        setSearched(true);
      }
    } catch (err) {
      setError('An error occurred while fetching marks');
      setSearched(true);
    } finally {
      setLoading(false);
    }
  };

  const getMark = (marks: Mark[], examId: string) => {
    return marks.find(m => m.examId === examId);
  };

  const calculateWeightedScore = (courseData: CourseData) => {
    return courseData.marks.reduce((sum, mark) => {
      const exam = courseData.exams.find(e => e._id === mark.examId);
      if (!exam) return sum;
      const finalMark = mark.roundedMark ?? mark.scaledMark ?? mark.rawMark;
      return sum + (finalMark / exam.totalMarks) * exam.weightage;
    }, 0);
  };

  const calculateTotalWeightage = (exams: Exam[]) => {
    return exams.reduce((sum, exam) => sum + exam.weightage, 0);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900">
      {/* Header */}
      <nav className="sticky top-0 z-50 backdrop-blur-md bg-gray-900/80 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Image
                src="/ulab.svg"
                alt="ULAB Logo"
                width={50}
                height={50}
                className="drop-shadow-lg"
              />
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                  📊 Check Your Marks
                </h1>
                <p className="text-xs text-gray-400">
                  Student Self-Service Portal
                </p>
              </div>
            </div>

            <Link
              href="/auth/signin"
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-all font-medium text-sm"
            >
              ← Back to Sign In
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto p-4 pt-8">
        {/* Search Section */}
        <div className="bg-gradient-to-br from-gray-800 to-gray-800/80 rounded-xl shadow-2xl p-6 mb-6 border border-gray-700/50">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-gray-100">
            <span className="w-1 h-6 bg-gradient-to-b from-blue-500 to-cyan-500 rounded-full"></span>
            Enter Your Student ID
          </h2>

          <form onSubmit={handleSearch} className="flex gap-3">
            <input
              type="text"
              required
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              className="flex-1 px-4 py-3 bg-gray-900 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-100 placeholder-gray-500"
              placeholder="Enter your Student ID (e.g., 2021-1-60-001)"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
          </form>

          {error && (
            <div className="mt-4 p-3 bg-red-900/30 border border-red-700 rounded-lg text-red-300 text-sm">
              {error}
            </div>
          )}
        </div>

        {/* Results Section */}
        {searched && courses.length > 0 && (
          <>
            {/* Student Info */}
            <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 rounded-xl shadow-2xl p-6 mb-6 border border-blue-700/50">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center text-2xl">
                  👨‍🎓
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-100">{studentName}</h2>
                  <p className="text-sm text-gray-400">Student ID: {studentId}</p>
                  <p className="text-sm text-emerald-400 mt-1">
                    Enrolled in {courses.length} course{courses.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            </div>

            {/* Courses */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {courses.map((courseData) => {
                const weightedScore = calculateWeightedScore(courseData);
                const totalWeightage = calculateTotalWeightage(courseData.exams);
                const marksCount = courseData.marks.length;
                const examsCount = courseData.exams.length;

                return (
                  <button
                    key={courseData.course._id}
                    onClick={() => {
                      setSelectedCourse(courseData);
                      setShowCourseModal(true);
                    }}
                    className="bg-gradient-to-br from-gray-800 to-gray-800/80 rounded-xl shadow-2xl border border-gray-700/50 p-6 text-left hover:border-blue-500/50 hover:shadow-blue-900/20 transition-all"
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <span className="text-3xl">
                        {courseData.course.courseType === 'Theory' ? '📖' : '🔬'}
                      </span>
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-100 mb-1">
                          {courseData.course.name}
                        </h3>
                        <p className="text-sm text-gray-400">
                          {courseData.course.code} • {courseData.course.semester} {courseData.course.year}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className={`px-3 py-1 rounded text-xs font-medium ${
                        courseData.course.courseType === 'Theory' 
                          ? 'bg-blue-900/30 text-blue-300' 
                          : 'bg-purple-900/30 text-purple-300'
                      }`}>
                        {courseData.course.courseType}
                      </span>
                      <span className="text-sm text-gray-400">
                        {marksCount}/{examsCount} exams
                      </span>
                      {courseData.course.showFinalGrade && marksCount > 0 && (
                        <span className="text-sm font-semibold text-emerald-400">
                          {weightedScore.toFixed(2)}/{totalWeightage}
                        </span>
                      )}
                    </div>

                    <div className="mt-4 text-sm text-blue-400 flex items-center gap-1">
                      Click to view marks
                      <span>→</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </>
        )}

        {/* Course Detail Modal */}
        {showCourseModal && selectedCourse && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
            <div className="bg-gradient-to-br from-gray-800 to-gray-800/80 rounded-2xl shadow-2xl max-w-5xl w-full border border-gray-700/50 p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">
                      {selectedCourse.course.courseType === 'Theory' ? '📖' : '🔬'}
                    </span>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-100">{selectedCourse.course.name}</h2>
                      <p className="text-sm text-gray-400 mt-1">
                        {selectedCourse.course.code} • {selectedCourse.course.semester} {selectedCourse.course.year}
                      </p>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowCourseModal(false);
                    setSelectedCourse(null);
                  }}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-all font-medium text-sm"
                >
                  Close
                </button>
              </div>

              {selectedCourse.exams.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-4xl mb-3">📭</div>
                  <p className="text-gray-400">No exams configured for this course yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {selectedCourse.exams.map((exam) => {
                    const mark = getMark(selectedCourse.marks, exam._id);
                    
                    return (
                      <div
                        key={exam._id}
                        className={`p-4 rounded-lg border ${
                          mark 
                            ? 'border-blue-700/50 bg-blue-900/20' 
                            : 'border-gray-700/50 bg-gray-900/30'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="font-semibold text-gray-100 mb-1">
                              {exam.displayName}
                            </h4>
                            <div className="text-sm text-gray-400">
                              Total: {exam.totalMarks} marks • Weightage: {exam.weightage}%
                              {exam.scalingMethod && (
                                <span className="ml-2 text-emerald-400">
                                  • Scaling: {exam.scalingMethod}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {mark ? (
                          <>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                              <div className="p-3 rounded-lg bg-blue-900/30 border border-blue-700/50">
                                <div className="text-xs text-gray-400 mb-1">Raw Mark</div>
                                <div className="text-xl font-bold text-blue-300">
                                  {mark.rawMark}
                                  <span className="text-sm text-gray-400 ml-1">/ {exam.totalMarks}</span>
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                  {((mark.rawMark / exam.totalMarks) * 100).toFixed(1)}%
                                </div>
                              </div>

                              {exam.scalingEnabled && mark.scaledMark !== undefined && mark.scaledMark !== null ? (
                                <div className="p-3 rounded-lg bg-emerald-900/30 border border-emerald-700/50">
                                  <div className="text-xs text-gray-400 mb-1">Scaled Mark</div>
                                  <div className="text-xl font-bold text-emerald-300">
                                    {mark.scaledMark.toFixed(2)}
                                  </div>
                                </div>
                              ) : (
                                <div className="p-3 rounded-lg bg-gray-700/30 border border-gray-600/50">
                                  <div className="text-xs text-gray-400 mb-1">Scaled Mark</div>
                                  <div className="text-sm text-gray-500 italic">Not scaled</div>
                                </div>
                              )}

                              {exam.scalingEnabled && mark.roundedMark !== undefined && mark.roundedMark !== null ? (
                                <div className="p-3 rounded-lg bg-purple-900/30 border border-purple-700/50">
                                  <div className="text-xs text-gray-400 mb-1">Final Mark</div>
                                  <div className="text-xl font-bold text-purple-300">
                                    {mark.roundedMark}
                                  </div>
                                </div>
                              ) : (
                                <div className="p-3 rounded-lg bg-gray-700/30 border border-gray-600/50">
                                  <div className="text-xs text-gray-400 mb-1">Final Mark</div>
                                  <div className="text-sm text-gray-500 italic">Not rounded</div>
                                </div>
                              )}
                            </div>

                            {/* CO Marks */}
                            {mark.coMarks && mark.coMarks.length > 0 && (
                              <div className="p-3 rounded-lg bg-gray-700/30 border border-gray-600/50">
                                <div className="text-sm font-medium text-gray-300 mb-2">
                                  CO-wise Breakdown
                                </div>
                                <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                                  {mark.coMarks.map((coMark, idx) => (
                                    <div key={idx} className="text-center">
                                      <div className="text-xs text-gray-400">CO{idx + 1}</div>
                                      <div className="text-lg font-semibold text-cyan-300">
                                        {coMark}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="text-center py-4 text-gray-500 italic">
                            Marks not recorded yet
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Course Summary */}
              {selectedCourse.course.showFinalGrade && selectedCourse.marks.length > 0 && (
                <div className="mt-6 p-4 rounded-lg bg-gradient-to-r from-blue-900/30 to-purple-900/30 border border-blue-700/50">
                  <h4 className="text-lg font-semibold text-gray-100 mb-3">Course Summary</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div>
                      <div className="text-xs text-gray-400">Exams Taken</div>
                      <div className="text-xl font-bold text-blue-300">
                        {selectedCourse.marks.length} / {selectedCourse.exams.length}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-400">Total Weightage</div>
                      <div className="text-xl font-bold text-emerald-300">
                        {calculateTotalWeightage(selectedCourse.exams)}%
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-400">Weighted Score</div>
                      <div className="text-xl font-bold text-purple-300">
                        {calculateWeightedScore(selectedCourse).toFixed(2)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-400">Current Grade</div>
                      <div className="text-xl font-bold text-cyan-300">
                        {calculateTotalWeightage(selectedCourse.exams) > 0 
                          ? `${((calculateWeightedScore(selectedCourse) / calculateTotalWeightage(selectedCourse.exams)) * 100).toFixed(1)}%`
                          : 'N/A'}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Empty State */}
        {searched && courses.length === 0 && !error && (
          <div className="bg-gradient-to-br from-gray-800 to-gray-800/80 rounded-xl shadow-2xl p-12 text-center border border-gray-700/50">
            <div className="w-20 h-20 rounded-full bg-gray-700/30 flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">🔍</span>
            </div>
            <h3 className="text-lg font-medium text-gray-100 mb-2">No Results Found</h3>
            <p className="text-gray-400">
              No records found for Student ID: {studentId}
            </p>
          </div>
        )}

        {/* Instructions */}
        {!searched && (
          <div className="bg-gradient-to-br from-gray-800 to-gray-800/80 rounded-xl shadow-2xl p-8 border border-gray-700/50">
            <h3 className="text-lg font-semibold text-gray-100 mb-4 flex items-center gap-2">
              <span className="text-2xl">💡</span>
              How to Check Your Marks
            </h3>
            <ul className="space-y-3 text-gray-300">
              <li className="flex items-start gap-2">
                <span className="text-blue-400 font-bold">1.</span>
                <span>Enter your complete Student ID in the search box above</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 font-bold">2.</span>
                <span>Click the "Search" button to retrieve your marks</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 font-bold">3.</span>
                <span>View all your courses by clicking on each course card</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 font-bold">4.</span>
                <span>See detailed marks including raw, scaled, and CO-wise breakdowns</span>
              </li>
            </ul>
            
            <div className="mt-6 p-4 bg-blue-900/20 border border-blue-700/50 rounded-lg">
              <p className="text-sm text-blue-300">
                <strong>Note:</strong> Make sure you enter your Student ID exactly as it appears in your records (including hyphens or special characters if any).
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
