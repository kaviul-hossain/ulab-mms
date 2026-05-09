'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Settings, Trash2 } from 'lucide-react';

interface Exam {
  _id: string;
  displayName: string;
  totalMarks: number;
  weightage: number;
  isRequired?: boolean;
  examCategory?: string;
  numberOfCOs?: number;
  numberOfQuestions?: number;
}

interface ExamSettings {
  displayName: string;
  weightage: string;
  totalMarks: string;
  numberOfCOs: string;
  numberOfQuestions: string;
  examCategory: string;
}

interface ExamsViewProps {
  exams: Exam[];
  onShowExamModal: () => void;
  onShowExamSettings: (examId: string) => void;
  onSetExamSettings: (settings: ExamSettings) => void;
  onDeleteExam: (examId: string) => void;
}

export default function ExamsView({
  exams,
  onShowExamModal,
  onShowExamSettings,
  onSetExamSettings,
  onDeleteExam,
}: ExamsViewProps) {
  return (
    <div className="space-y-6">
      <Card className="overflow-hidden border-border/60 bg-card/80 shadow-sm backdrop-blur">
        <CardHeader className="border-b border-border/60 bg-muted/30">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-3xl font-bold tracking-tight text-foreground">
                Exam Management
              </CardTitle>
              <CardDescription className="mt-1">
                Configure and manage {exams.length} exam(s)
              </CardDescription>
            </div>
            <Button onClick={onShowExamModal} className="sm:self-start">
              <Plus className="w-4 h-4 mr-2" />
              Add New Exam
            </Button>
          </div>
        </CardHeader>

        {exams.length === 0 ? (
          <CardContent className="pt-12 pb-12 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted text-3xl">
              📝
            </div>
            <CardTitle className="text-xl mb-2">No exams yet</CardTitle>
            <CardDescription className="mb-6">
              Create your first exam to start tracking student performance.
            </CardDescription>
            <Button onClick={onShowExamModal}>
              <Plus className="w-4 h-4 mr-2" />
              Create First Exam
            </Button>
          </CardContent>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="pl-6">Exam</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Total Marks</TableHead>
                  <TableHead>Weightage</TableHead>
                  <TableHead>COs / Questions</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right pr-6">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {exams.map((exam, index) => (
                  <TableRow key={exam._id} className={index % 2 === 0 ? 'bg-background' : 'bg-muted/20'}>
                    <TableCell className="pl-6">
                      <div className="min-w-0">
                        <div className="font-medium text-foreground">{exam.displayName}</div>
                        <div className="mt-1 flex flex-wrap gap-2">
                          {exam.examCategory && (
                            <Badge variant="outline" className="font-normal">
                              {exam.examCategory}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground capitalize">
                        {exam.examCategory || exam.displayName}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">{exam.totalMarks}</span>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium text-emerald-600 dark:text-emerald-400">
                        {exam.weightage}%
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {exam.numberOfCOs ? `${exam.numberOfCOs} CO${exam.numberOfCOs > 1 ? 's' : ''}` : '—'}
                        {' '}
                        /{' '}
                        {exam.numberOfQuestions ? `${exam.numberOfQuestions} Qs` : '—'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        {exam.isRequired ? (
                          <Badge variant="secondary">Required</Badge>
                        ) : (
                          <Badge variant="outline">Optional</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="pr-6">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            onShowExamSettings(exam._id);
                            onSetExamSettings({
                              displayName: exam.displayName,
                              weightage: exam.weightage.toString(),
                              totalMarks: exam.totalMarks.toString(),
                              numberOfCOs: exam.numberOfCOs?.toString() || '',
                              numberOfQuestions: exam.numberOfQuestions?.toString() || '',
                              examCategory: exam.examCategory || '',
                            });
                          }}
                        >
                          <Settings className="w-4 h-4" />
                        </Button>
                        {!exam.isRequired && (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => onDeleteExam(exam._id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>
    </div>
  );
}
