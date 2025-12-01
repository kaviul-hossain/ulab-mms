'use client';

import { useState, useEffect, useRef, KeyboardEvent } from 'react';
import { Button } from '@/components/ui/button';
import { X, Save, Loader2 } from 'lucide-react';
import { notify } from '@/app/utils/notifications';

interface Student {
  _id: string;
  studentId: string;
  name: string;
}

interface Exam {
  _id: string;
  displayName: string;
  totalMarks: number;
  numberOfCOs?: number;
  numberOfQuestions?: number;
}

interface Mark {
  _id: string;
  studentId: string;
  examId: string;
  rawMark: number;
  coMarks?: number[];
  questionMarks?: number[];
}

interface BulkMarkEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  exams: Exam[];
  marks: Mark[];
  courseId: string;
  onMarksSaved: () => void;
}

interface MarkEntry {
  studentId: string;
  rawMark: string;
  coMarks: string[];
  questionMarks: string[];
}

export default function BulkMarkEntryModal({
  isOpen,
  onClose,
  students,
  exams,
  marks,
  courseId,
  onMarksSaved,
}: BulkMarkEntryModalProps) {
  const [selectedExamId, setSelectedExamId] = useState<string>('');
  const [markEntries, setMarkEntries] = useState<MarkEntry[]>([]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [showEmptyDialog, setShowEmptyDialog] = useState(false);
  const [emptyCount, setEmptyCount] = useState(0);
  
  // Refs for all input fields
  const inputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  const selectedExam = exams.find(e => e._id === selectedExamId);
  const numberOfCOs = selectedExam?.numberOfCOs || 0;
  const numberOfQuestions = selectedExam?.numberOfQuestions || 0;

  // Initialize mark entries when exam is selected
  useEffect(() => {
    if (selectedExamId && students.length > 0) {
      const entries: MarkEntry[] = students.map(student => {
        const existingMark = marks.find(m => m.studentId === student._id && m.examId === selectedExamId);
        
        return {
          studentId: student._id,
          rawMark: existingMark?.rawMark?.toString() || '',
          coMarks: existingMark?.coMarks?.map(m => m.toString()) || new Array(numberOfCOs).fill(''),
          questionMarks: existingMark?.questionMarks?.map(m => m.toString()) || new Array(numberOfQuestions).fill(''),
        };
      });
      setMarkEntries(entries);
    }
  }, [selectedExamId, students, marks, numberOfCOs, numberOfQuestions]);

  // Focus first input when exam is selected
  useEffect(() => {
    if (selectedExamId && markEntries.length > 0) {
      setTimeout(() => {
        const firstKey = getFieldKey(0, 'rawMark');
        inputRefs.current[firstKey]?.focus();
      }, 100);
    }
  }, [selectedExamId, markEntries.length]);

  const getFieldKey = (studentIndex: number, field: string, subIndex?: number): string => {
    if (subIndex !== undefined) {
      return `${studentIndex}-${field}-${subIndex}`;
    }
    return `${studentIndex}-${field}`;
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>, studentIndex: number, field: string, subIndex?: number) => {
    if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault();
      moveToNextField(studentIndex, field, subIndex, e.shiftKey);
    }
  };

  const moveToNextField = (studentIndex: number, field: string, subIndex: number | undefined, isShiftTab: boolean) => {
    if (isShiftTab) {
      moveToPreviousField(studentIndex, field, subIndex);
    } else {
      moveToNextFieldForward(studentIndex, field, subIndex);
    }
  };

  const moveToNextFieldForward = (studentIndex: number, field: string, subIndex: number | undefined) => {
    // If we're in rawMark field
    if (field === 'rawMark') {
      if (numberOfCOs > 0) {
        // Move to first CO
        const nextKey = getFieldKey(studentIndex, 'co', 0);
        inputRefs.current[nextKey]?.focus();
      } else if (numberOfQuestions > 0) {
        // Move to first Question
        const nextKey = getFieldKey(studentIndex, 'q', 0);
        inputRefs.current[nextKey]?.focus();
      } else {
        // Move to next student's rawMark
        if (studentIndex < students.length - 1) {
          const nextKey = getFieldKey(studentIndex + 1, 'rawMark');
          inputRefs.current[nextKey]?.focus();
        }
      }
    }
    // If we're in a CO field
    else if (field === 'co' && subIndex !== undefined) {
      if (subIndex < numberOfCOs - 1) {
        // Move to next CO
        const nextKey = getFieldKey(studentIndex, 'co', subIndex + 1);
        inputRefs.current[nextKey]?.focus();
      } else if (numberOfQuestions > 0) {
        // Move to first Question
        const nextKey = getFieldKey(studentIndex, 'q', 0);
        inputRefs.current[nextKey]?.focus();
      } else {
        // Move to next student's rawMark
        if (studentIndex < students.length - 1) {
          const nextKey = getFieldKey(studentIndex + 1, 'rawMark');
          inputRefs.current[nextKey]?.focus();
        }
      }
    }
    // If we're in a Question field
    else if (field === 'q' && subIndex !== undefined) {
      if (subIndex < numberOfQuestions - 1) {
        // Move to next Question
        const nextKey = getFieldKey(studentIndex, 'q', subIndex + 1);
        inputRefs.current[nextKey]?.focus();
      } else {
        // Move to next student's rawMark
        if (studentIndex < students.length - 1) {
          const nextKey = getFieldKey(studentIndex + 1, 'rawMark');
          inputRefs.current[nextKey]?.focus();
        }
      }
    }
  };

  const moveToPreviousField = (studentIndex: number, field: string, subIndex: number | undefined) => {
    // If we're in rawMark field
    if (field === 'rawMark') {
      if (studentIndex > 0) {
        // Move to previous student's last field
        if (numberOfQuestions > 0) {
          const prevKey = getFieldKey(studentIndex - 1, 'q', numberOfQuestions - 1);
          inputRefs.current[prevKey]?.focus();
        } else if (numberOfCOs > 0) {
          const prevKey = getFieldKey(studentIndex - 1, 'co', numberOfCOs - 1);
          inputRefs.current[prevKey]?.focus();
        } else {
          const prevKey = getFieldKey(studentIndex - 1, 'rawMark');
          inputRefs.current[prevKey]?.focus();
        }
      }
    }
    // If we're in a CO field
    else if (field === 'co' && subIndex !== undefined) {
      if (subIndex > 0) {
        // Move to previous CO
        const prevKey = getFieldKey(studentIndex, 'co', subIndex - 1);
        inputRefs.current[prevKey]?.focus();
      } else {
        // Move to rawMark
        const prevKey = getFieldKey(studentIndex, 'rawMark');
        inputRefs.current[prevKey]?.focus();
      }
    }
    // If we're in a Question field
    else if (field === 'q' && subIndex !== undefined) {
      if (subIndex > 0) {
        // Move to previous Question
        const prevKey = getFieldKey(studentIndex, 'q', subIndex - 1);
        inputRefs.current[prevKey]?.focus();
      } else if (numberOfCOs > 0) {
        // Move to last CO
        const prevKey = getFieldKey(studentIndex, 'co', numberOfCOs - 1);
        inputRefs.current[prevKey]?.focus();
      } else {
        // Move to rawMark
        const prevKey = getFieldKey(studentIndex, 'rawMark');
        inputRefs.current[prevKey]?.focus();
      }
    }
  };

  const updateMarkEntry = (studentIndex: number, field: string, value: string, subIndex?: number) => {
    setMarkEntries(prev => {
      const newEntries = [...prev];
      if (field === 'rawMark') {
        newEntries[studentIndex].rawMark = value;
      } else if (field === 'co' && subIndex !== undefined) {
        const newCoMarks = [...newEntries[studentIndex].coMarks];
        newCoMarks[subIndex] = value;
        newEntries[studentIndex].coMarks = newCoMarks;
      } else if (field === 'q' && subIndex !== undefined) {
        const newQuestionMarks = [...newEntries[studentIndex].questionMarks];
        newQuestionMarks[subIndex] = value;
        newEntries[studentIndex].questionMarks = newQuestionMarks;
      }
      return newEntries;
    });
  };

  const validateAndSave = async (fillEmptyWithZero: boolean = false) => {
    if (!selectedExam) return;

    setError('');
    setSaving(true);

    try {
      const marksToSave = [];
      
      for (let i = 0; i < markEntries.length; i++) {
        const entry = markEntries[i];
        const rawMarkValue = entry.rawMark.trim();
        
        // Skip if empty and not filling with zeros
        if (!rawMarkValue) {
          if (!fillEmptyWithZero) {
            continue;
          }
        }

        const rawMarkNum = fillEmptyWithZero && !rawMarkValue ? 0 : parseFloat(rawMarkValue);

        // Validate raw mark
        if (isNaN(rawMarkNum) || rawMarkNum < 0) {
          setError(`Invalid mark for ${students[i].studentId}: Must be a positive number`);
          setSaving(false);
          return;
        }

        if (rawMarkNum > selectedExam.totalMarks) {
          setError(`Invalid mark for ${students[i].studentId}: Exceeds maximum of ${selectedExam.totalMarks}`);
          setSaving(false);
          return;
        }

        // Prepare mark data
        const markData: any = {
          studentId: entry.studentId,
          examId: selectedExamId,
          rawMark: rawMarkNum,
        };

        // Validate CO marks if applicable
        if (numberOfCOs > 0) {
          const coMarksNum = entry.coMarks.map(cm => {
            const val = cm.trim();
            return val ? parseFloat(val) : 0;
          });

          // Check if all CO marks are valid
          if (coMarksNum.some(cm => isNaN(cm) || cm < 0)) {
            setError(`Invalid CO marks for ${students[i].studentId}: Must be positive numbers`);
            setSaving(false);
            return;
          }

          // Check if CO marks sum equals raw mark
          const coMarksSum = coMarksNum.reduce((sum, cm) => sum + cm, 0);
          if (Math.abs(coMarksSum - rawMarkNum) > 0.01) {
            setError(`CO marks for ${students[i].studentId} must sum to ${rawMarkNum}. Current sum: ${coMarksSum.toFixed(2)}`);
            setSaving(false);
            return;
          }

          markData.coMarks = coMarksNum;
        }

        // Validate Question marks if applicable
        if (numberOfQuestions > 0) {
          const questionMarksNum = entry.questionMarks.map(qm => {
            const val = qm.trim();
            return val ? parseInt(val) : 0;
          });

          // Check if all Question marks are valid
          if (questionMarksNum.some(qm => isNaN(qm) || qm < 0)) {
            setError(`Invalid Question marks for ${students[i].studentId}: Must be non-negative integers`);
            setSaving(false);
            return;
          }

          // Check if Question marks sum equals raw mark
          const questionMarksSum = questionMarksNum.reduce((sum, qm) => sum + qm, 0);
          if (questionMarksSum !== rawMarkNum) {
            setError(`Question marks for ${students[i].studentId} must sum to ${rawMarkNum}. Current sum: ${questionMarksSum}`);
            setSaving(false);
            return;
          }

          markData.questionMarks = questionMarksNum;
        }

        marksToSave.push(markData);
      }

      if (marksToSave.length === 0) {
        setError('No marks to save. Please enter at least one mark.');
        setSaving(false);
        return;
      }

      // Save all marks using bulk API or individual API calls
      let successCount = 0;
      for (const markData of marksToSave) {
        const response = await fetch('/api/marks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            courseId,
            ...markData,
          }),
        });

        if (response.ok) {
          successCount++;
        } else {
          const data = await response.json();
          console.error(`Failed to save mark for student ${markData.studentId}:`, data.error);
        }
      }

      setSaving(false);
      
      if (successCount > 0) {
        notify.mark.bulkSaved(successCount);
        onMarksSaved();
        onClose();
      } else {
        notify.mark.bulkSaveError();
        setError('Failed to save marks. Please try again.');
      }
    } catch (err) {
      console.error('Error saving marks:', err);
      notify.mark.bulkSaveError();
      setError('An error occurred while saving marks');
      setSaving(false);
    }
  };

  const handleSaveClick = () => {
    // Count empty entries
    const emptyEntries = markEntries.filter(entry => !entry.rawMark.trim()).length;
    
    if (emptyEntries > 0) {
      setEmptyCount(emptyEntries);
      setShowEmptyDialog(true);
    } else {
      validateAndSave(false);
    }
  };

  const handleExamSelect = (examId: string) => {
    setSelectedExamId(examId);
    setError('');
  };

  const handleClose = () => {
    setSelectedExamId('');
    setMarkEntries([]);
    setError('');
    setShowEmptyDialog(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="bg-gradient-to-br from-gray-800 to-gray-800/80 rounded-2xl shadow-2xl w-full max-w-[95vw] h-[90vh] border border-gray-700/50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-gray-100">Sequential Mark Entry</h2>
            <p className="text-sm text-gray-400 mt-1">
              {selectedExam ? `${selectedExam.displayName} - ${students.length} students` : 'Select an exam to begin'}
            </p>
          </div>
          <Button
            onClick={handleClose}
            variant="ghost"
            size="sm"
            className="text-gray-400 hover:text-gray-200"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Exam Selection */}
        {!selectedExamId && (
          <div className="flex-1 overflow-y-auto p-6">
            <h3 className="text-lg font-semibold text-gray-200 mb-4">Select an exam:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {exams.map(exam => {
                const examMarks = marks.filter(m => m.examId === exam._id).length;
                return (
                  <button
                    key={exam._id}
                    onClick={() => handleExamSelect(exam._id)}
                    className="p-4 rounded-lg border-2 border-gray-600 bg-gray-900/50 hover:border-gray-500 transition-all text-left"
                  >
                    <div className="font-semibold text-gray-100">{exam.displayName}</div>
                    <div className="text-sm text-gray-400 mt-1">
                      Total: {exam.totalMarks} marks
                      {exam.numberOfCOs && ` • ${exam.numberOfCOs} COs`}
                      {exam.numberOfQuestions && ` • ${exam.numberOfQuestions} Questions`}
                    </div>
                    <div className="text-xs text-gray-500 mt-2">
                      {examMarks}/{students.length} students entered
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Mark Entry Table */}
        {selectedExamId && selectedExam && (
          <>
            <div className="flex-1 overflow-auto p-6">
              {error && (
                <div className="mb-4 p-3 bg-red-900/30 border border-red-700 rounded-lg text-red-300 text-sm">
                  {error}
                </div>
              )}

              <div className="overflow-x-auto">
                <table className="min-w-full border border-gray-700 rounded-lg">
                  <thead className="bg-gray-900 sticky top-0 z-10">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-300 border-b border-gray-700 w-48">
                        Student
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-300 border-b border-gray-700 w-32">
                        Raw Mark
                        <div className="text-[10px] font-normal mt-0.5 text-gray-500">Max: {selectedExam.totalMarks}</div>
                      </th>
                      {numberOfCOs > 0 && Array.from({ length: numberOfCOs }, (_, i) => (
                        <th key={`co-${i}`} className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-300 border-b border-gray-700 w-24">
                          CO{i + 1}
                        </th>
                      ))}
                      {numberOfQuestions > 0 && Array.from({ length: numberOfQuestions }, (_, i) => (
                        <th key={`q-${i}`} className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-300 border-b border-gray-700 w-24">
                          Q{i + 1}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700/50">
                    {students.map((student, studentIndex) => (
                      <tr key={student._id} className={`transition-colors hover:bg-gray-700/30 ${studentIndex % 2 === 0 ? 'bg-gray-900/30' : 'bg-gray-800/30'}`}>
                        <td className="px-4 py-3 text-sm">
                          <div className="font-medium text-blue-300">{student.studentId}</div>
                          <div className="text-xs text-gray-400">{student.name}</div>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <input
                            ref={(el) => {
                              inputRefs.current[getFieldKey(studentIndex, 'rawMark')] = el;
                            }}
                            type="number"
                            min="0"
                            max={selectedExam.totalMarks}
                            step="0.01"
                            value={markEntries[studentIndex]?.rawMark || ''}
                            onChange={(e) => updateMarkEntry(studentIndex, 'rawMark', e.target.value)}
                            onKeyDown={(e) => handleKeyDown(e, studentIndex, 'rawMark')}
                            className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-100 text-center"
                            placeholder="0"
                          />
                        </td>
                        {numberOfCOs > 0 && Array.from({ length: numberOfCOs }, (_, coIndex) => (
                          <td key={`co-${coIndex}`} className="px-4 py-3 text-sm">
                            <input
                              ref={(el) => {
                                inputRefs.current[getFieldKey(studentIndex, 'co', coIndex)] = el;
                              }}
                              type="number"
                              min="0"
                              step="0.01"
                              value={markEntries[studentIndex]?.coMarks[coIndex] || ''}
                              onChange={(e) => updateMarkEntry(studentIndex, 'co', e.target.value, coIndex)}
                              onKeyDown={(e) => handleKeyDown(e, studentIndex, 'co', coIndex)}
                              className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-100 text-center"
                              placeholder="0"
                            />
                          </td>
                        ))}
                        {numberOfQuestions > 0 && Array.from({ length: numberOfQuestions }, (_, qIndex) => (
                          <td key={`q-${qIndex}`} className="px-4 py-3 text-sm">
                            <input
                              ref={(el) => {
                                inputRefs.current[getFieldKey(studentIndex, 'q', qIndex)] = el;
                              }}
                              type="number"
                              min="0"
                              step="1"
                              value={markEntries[studentIndex]?.questionMarks[qIndex] || ''}
                              onChange={(e) => updateMarkEntry(studentIndex, 'q', e.target.value, qIndex)}
                              onKeyDown={(e) => handleKeyDown(e, studentIndex, 'q', qIndex)}
                              className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-100 text-center"
                              placeholder="0"
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 p-3 bg-blue-900/20 border border-blue-700/50 rounded-lg">
                <p className="text-sm text-blue-300">
                  💡 <strong>Navigation:</strong> Press Tab or Enter to move to the next field. Press Shift+Tab to go back.
                </p>
                {(numberOfCOs > 0 || numberOfQuestions > 0) && (
                  <p className="text-xs text-blue-400 mt-2">
                    ⚠️ {numberOfCOs > 0 && 'CO marks must sum to the Raw Mark.'} {numberOfQuestions > 0 && 'Question marks must sum to the Raw Mark.'}
                  </p>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-700 flex gap-3">
              <Button
                onClick={() => setSelectedExamId('')}
                variant="outline"
                className="flex-1"
              >
                ← Change Exam
              </Button>
              <Button
                onClick={handleSaveClick}
                disabled={saving}
                className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save All Marks
                  </>
                )}
              </Button>
            </div>
          </>
        )}
      </div>

      {/* Empty Fields Dialog */}
      {showEmptyDialog && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[110]">
          <div className="bg-gray-800 rounded-xl shadow-2xl max-w-md w-full mx-4 border border-gray-700 p-6">
            <h3 className="text-xl font-bold text-gray-100 mb-4">⚠️ Empty Fields Detected</h3>
            <p className="text-gray-300 mb-6">
              {emptyCount} student(s) have empty marks. What would you like to do?
            </p>
            <div className="flex flex-col gap-3">
              <Button
                onClick={() => {
                  setShowEmptyDialog(false);
                  validateAndSave(true);
                }}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                Fill Empty with 0
              </Button>
              <Button
                onClick={() => {
                  setShowEmptyDialog(false);
                  validateAndSave(false);
                }}
                variant="outline"
                className="w-full"
              >
                Leave Empty (Skip)
              </Button>
              <Button
                onClick={() => setShowEmptyDialog(false)}
                variant="ghost"
                className="w-full"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
