'use client';

interface Student {
  _id: string;
  studentId: string;
  name: string;
}

interface Exam {
  _id: string;
  displayName: string;
  examType: 'midterm' | 'final' | 'labFinal' | 'oel' | 'custom';
  totalMarks: number;
  weightage: number;
  numberOfCOs?: number;
  scalingEnabled: boolean;
  scalingMethod?: string;
}

interface Mark {
  _id: string;
  studentId: string;
  examId: string;
  rawMark: number;
  coMarks?: number[];
  scaledMark?: number;
  roundedMark?: number;
}

interface StudentDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
  exams: Exam[];
  marks: Mark[];
}

export default function StudentDetailModal({
  isOpen,
  onClose,
  student,
  exams,
  marks,
}: StudentDetailModalProps) {
  if (!isOpen || !student) return null;

  const studentMarks = marks.filter(m => m.studentId === student._id);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="bg-gradient-to-br from-gray-800 to-gray-800/80 rounded-2xl shadow-2xl max-w-4xl w-full border border-gray-700/50 p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-100">{student.name}</h2>
            <p className="text-sm text-gray-400 mt-1">Student ID: {student.studentId}</p>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-all font-medium text-sm"
          >
            Close
          </button>
        </div>

        {studentMarks.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-20 h-20 rounded-full bg-gray-700/30 flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">📝</span>
            </div>
            <h3 className="text-lg font-medium text-gray-300 mb-2">No Marks Yet</h3>
            <p className="text-gray-500">This student has no marks recorded.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {exams.map(exam => {
              const mark = studentMarks.find(m => m.examId === exam._id);
              
              if (!mark) {
                return (
                  <div key={exam._id} className="p-4 rounded-lg border border-gray-700/50 bg-gray-900/30">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-gray-100">{exam.displayName}</div>
                        <div className="text-sm text-gray-400 mt-1">
                          Total: {exam.totalMarks} marks • Weightage: {exam.weightage}%
                        </div>
                      </div>
                      <div className="text-sm text-gray-500 italic">Not recorded</div>
                    </div>
                  </div>
                );
              }

              return (
                <div key={exam._id} className="p-4 rounded-lg border border-blue-700/50 bg-blue-900/20">
                  <div className="mb-3">
                    <div className="font-semibold text-gray-100 mb-1">{exam.displayName}</div>
                    <div className="text-sm text-gray-400">
                      Total: {exam.totalMarks} marks • Weightage: {exam.weightage}%
                      {exam.scalingMethod && (
                        <span className="ml-2 text-emerald-400">• Scaling: {exam.scalingMethod}</span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                    <div className="p-3 rounded-lg bg-blue-900/30 border border-blue-700/50">
                      <div className="text-xs text-gray-400 mb-1">Raw Mark</div>
                      <div className="text-2xl font-bold text-blue-300">
                        {mark.rawMark}
                        <span className="text-sm text-gray-400 ml-1">/ {exam.totalMarks}</span>
                      </div>
                    </div>

                    {exam.scalingEnabled && mark.scaledMark !== undefined && mark.scaledMark !== null ? (
                      <div className="p-3 rounded-lg bg-emerald-900/30 border border-emerald-700/50">
                        <div className="text-xs text-gray-400 mb-1">Scaled Mark</div>
                        <div className="text-2xl font-bold text-emerald-300">
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
                        <div className="text-xs text-gray-400 mb-1">Rounded Mark</div>
                        <div className="text-2xl font-bold text-purple-300">
                          {mark.roundedMark}
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 rounded-lg bg-gray-700/30 border border-gray-600/50">
                        <div className="text-xs text-gray-400 mb-1">Rounded Mark</div>
                        <div className="text-sm text-gray-500 italic">Not rounded</div>
                      </div>
                    )}
                  </div>

                  {/* CO Marks Breakdown */}
                  {mark.coMarks && mark.coMarks.length > 0 && (
                    <div className="mt-3 p-3 rounded-lg bg-gray-700/30 border border-gray-600/50">
                      <div className="text-sm font-medium text-gray-300 mb-2">CO-wise Marks</div>
                      <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                        {mark.coMarks.map((coMark, idx) => (
                          <div key={idx} className="text-center">
                            <div className="text-xs text-gray-400">CO{idx + 1}</div>
                            <div className="text-lg font-semibold text-cyan-300">{coMark}</div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-2 text-xs text-gray-500">
                        Total: {mark.coMarks.reduce((sum, cm) => sum + cm, 0).toFixed(2)}
                      </div>
                    </div>
                  )}

                  {/* Percentage */}
                  <div className="mt-3 flex items-center justify-between text-sm">
                    <span className="text-gray-400">Percentage:</span>
                    <span className="font-semibold text-gray-200">
                      {((mark.rawMark / exam.totalMarks) * 100).toFixed(2)}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Overall Summary */}
        {studentMarks.length > 0 && (
          <div className="mt-6 p-4 rounded-lg bg-gradient-to-r from-blue-900/30 to-purple-900/30 border border-blue-700/50">
            <h3 className="text-lg font-semibold text-gray-100 mb-3">Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <div className="text-xs text-gray-400">Exams Completed</div>
                <div className="text-xl font-bold text-blue-300">
                  {studentMarks.length} / {exams.length}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-400">Total Raw Marks</div>
                <div className="text-xl font-bold text-emerald-300">
                  {studentMarks.reduce((sum, m) => sum + m.rawMark, 0).toFixed(2)}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-400">Average Percentage</div>
                <div className="text-xl font-bold text-purple-300">
                  {studentMarks.length > 0
                    ? (
                        studentMarks.reduce((sum, m) => {
                          const exam = exams.find(e => e._id === m.examId);
                          return sum + (exam ? (m.rawMark / exam.totalMarks) * 100 : 0);
                        }, 0) / studentMarks.length
                      ).toFixed(2)
                    : 0}%
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-400">Weighted Score</div>
                <div className="text-xl font-bold text-cyan-300">
                  {studentMarks.reduce((sum, m) => {
                    const exam = exams.find(e => e._id === m.examId);
                    if (!exam) return sum;
                    const finalMark = m.roundedMark ?? m.scaledMark ?? m.rawMark;
                    return sum + (finalMark / exam.totalMarks) * exam.weightage;
                  }, 0).toFixed(2)}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
