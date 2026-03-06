'use client';

import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, ArrowLeft, Check } from 'lucide-react';
import Image from 'next/image';
import { toast } from 'sonner';

interface Student {
  _id: string;
  name: string;
  rollNumber?: string;
  studentId?: string;
}

interface ReportRubrics {
  abstractAndBackground?: number;
  literatureReview?: number;
  performanceEvaluation?: number;
  literatureAnalysis?: number;
  projectManagement?: number;
  modernTools?: number;
  designSolution?: number;
  implementSolution?: number;
  experimentalResult?: number;
  societalAspects?: number;
  sustainability?: number;
  ethicalPrinciples?: number;
  conclusion?: number;
  references?: number;
}

interface CapstoneRecord {
  _id: string;
  studentId: Student;
  reportMarks?: number;
  reportComments?: string;
  reportRubrics?: ReportRubrics;
  createdAt: string;
}

interface CapstoneGroup {
  _id: string;
  groupName: string;
  courseId: {
    _id: string;
    code: string;
    name: string;
  };
  supervisorId: {
    _id: string;
    name: string;
  };
  semester?: string;
  studentIds: Student[];
}

const RUBRICS_CSE4098A = [
  { key: 'abstract', label: 'Abstract' },
  { key: 'backgroundLiterature', label: 'Background Literature' },
  { key: 'problemStatement', label: 'Problem Statement' },
  { key: 'objectiveAndSignificance', label: 'Objective & Significance of the Study' },
  { key: 'scopeAndLimitation', label: 'Scope & Limitation' },
  { key: 'literatureReviewAndAnalysis', label: 'Literature Review & Analysis' },
  { key: 'requirementsTaskDistributionBudgets', label: 'Requirements, Task Distribution, and Budgets' },
  { key: 'conclusion', label: 'Conclusion' },
  { key: 'referencesAndCitations', label: 'References & Citations' },
  { key: 'communication', label: 'Communication (Spelling, Grammar, Punctuation, and Plagiarism)' },
  { key: 'tools', label: 'Tools' },
];

const RUBRICS_CSE4098B = [
  { key: 'abstractAndBackground', label: 'Abstract, Background Literature, Problem Statement, Objective & Significance of the Study, Scope & Limitation' },
  { key: 'literatureReview', label: 'Literature Review' },
  { key: 'performanceEvaluation', label: 'Identification of Performance Evaluation Criterion' },
  { key: 'literatureAnalysis', label: 'Literature Analysis' },
  { key: 'projectManagement', label: 'Project Management and Financial Activity' },
  { key: 'modernTools', label: 'Usage of Modern Tools' },
  { key: 'designSolution', label: 'Design the Solution' },
  { key: 'implementSolution', label: 'Implement the solution' },
  { key: 'experimentalResult', label: 'Investigate the experimental result' },
  { key: 'societalAspects', label: 'Societal, health, safety, legal and cultural aspects' },
  { key: 'sustainability', label: 'Environment and sustainability' },
  { key: 'ethicalPrinciples', label: 'Ethical and professional principles' },
  { key: 'conclusion', label: 'Conclusion' },
  { key: 'references', label: 'References & Citations, Spelling, Grammar, Punctuation and Plagiarism' },
];

const RUBRICS_CSE4098C_CSE499 = [
  { key: 'abstractProblemStatement', label: 'Abstract, Problem statement, Aims, Objective & Significance, Scope & Limitation' },
  { key: 'literatureReviewAnalysis', label: 'Literature Review & Analysis' },
  { key: 'performanceEvaluationCriterion', label: 'Performance Evaluation Criterion' },
  { key: 'projectManagementFinancial', label: 'Project Management and Financial Activity' },
  { key: 'usageModernTools', label: 'Usage of Modern Tools' },
  { key: 'implementation', label: 'Implementation' },
  { key: 'evaluateSolution', label: 'Evaluate the solution' },
  { key: 'investigateFinalResult', label: 'Investigate the final result' },
  { key: 'societalHealthSafety', label: 'Societal, health, safety, legal and cultural aspects' },
  { key: 'environmentSustainability', label: 'Environment and sustainability' },
  { key: 'ethicalProfessional', label: 'Ethical and professional principles' },
  { key: 'conclusionFutureWorks', label: 'Conclusion & Future Works' },
  { key: 'referencesCitations', label: 'References & Citations, Spelling, Grammar, Punctuation, and Plagiarism' },
];

const getRubrics = (courseCode: string) => {
  if (courseCode?.includes('4098B')) {
    return RUBRICS_CSE4098B;
  } else if (courseCode?.includes('4098C') || courseCode?.includes('499')) {
    return RUBRICS_CSE4098C_CSE499;
  }
  return RUBRICS_CSE4098A;
};

const getTotalMarksLimit = (courseCode: string) => {
  if (courseCode?.includes('4098B')) {
    return 42; // 14 rubrics × 3
  } else if (courseCode?.includes('4098C') || courseCode?.includes('499')) {
    return 39; // 13 rubrics × 3
  }
  return 33; // 11 rubrics × 3
};

export default function ReportPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const semester = params?.semester as string;
  const category = params?.category as string;
  const [capstoneRecords, setCapstoneRecords] = useState<CapstoneRecord[]>([]);
  const [capstoneGroups, setCapstoneGroups] = useState<CapstoneGroup[]>([]);
  const [groupSearchQuery, setGroupSearchQuery] = useState<string>('');
  const [selectedGroup, setSelectedGroup] = useState<CapstoneGroup | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showGroupMarksModal, setShowGroupMarksModal] = useState(false);
  const [rubrics, setRubrics] = useState<ReportRubrics>({});
  const [comments, setComments] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    } else if (status === 'authenticated') {
      fetchCapstoneRecords();
      fetchCapstoneGroups();
    }
  }, [status, router]);

  const fetchCapstoneRecords = async () => {
    try {
      const response = await fetch(`/api/capstone?submissionType=report&courseCode=${category}`);
      if (!response.ok) throw new Error('Failed to fetch records');
      const data = await response.json();
      setCapstoneRecords(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching capstone records:', error);
      setLoading(false);
    }
  };

  const fetchCapstoneGroups = async () => {
    try {
      const params = new URLSearchParams({
        courseCode: category,
        semester: semester,
      });
      
      const response = await fetch(`/api/capstone-groups?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch groups');
      const data: CapstoneGroup[] = await response.json();
      setCapstoneGroups(data);
    } catch (error) {
      console.error('Error fetching capstone groups:', error);
      toast.error('Failed to load capstone groups');
    }
  };

  const handleOpenGroupMarksModal = (group: CapstoneGroup) => {
    setSelectedGroup(group);
    // Load existing marks from the first student in the group (all same for group)
    const firstStudentRecord = capstoneRecords.find(
      (r) => r.studentId._id === group.studentIds[0]._id
    );
    if (firstStudentRecord?.reportRubrics) {
      setRubrics(firstStudentRecord.reportRubrics);
      setComments(firstStudentRecord.reportComments || '');
    } else {
      setRubrics({});
      setComments('');
    }
    setShowGroupMarksModal(true);
  };

  const calculateTotalMarks = (rubricMarks: ReportRubrics): number => {
    return Object.values(rubricMarks).reduce((sum, mark) => {
      const num = typeof mark === 'string' ? parseInt(mark) : (mark || 0);
      return sum + (isNaN(num as any) ? 0 : num);
    }, 0);
  };

  const handleSubmitGroupMarks = async () => {
    if (!selectedGroup) {
      toast.error('No group selected');
      return;
    }

    // Check if at least one rubric has been filled
    if (Object.values(rubrics).every(val => val === undefined || val === null || val === '')) {
      toast.error('Please fill in at least one rubric');
      return;
    }

    // Validate all rubric values are between 0 and 3
    for (const [key, value] of Object.entries(rubrics)) {
      if (value !== undefined && value !== null) {
        const num = typeof value === 'string' ? parseInt(value) : value;
        if (isNaN(num) || num < 0 || num > 3) {
          toast.error(`Invalid mark for ${getRubrics(category).find((r: any) => r.key === key)?.label}`);
          return;
        }
      }
    }

    const totalMarks = calculateTotalMarks(rubrics as any);

    setSubmitting(true);
    try {
      // Submit same marks to ALL students in the group
      for (const student of selectedGroup.studentIds) {
        const response = await fetch('/api/capstone', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            studentId: student._id,
            supervisorId: session?.user?.id,
            courseId: selectedGroup.courseId._id,
            groupId: selectedGroup._id,
            reportRubrics: rubrics,
            reportMarks: totalMarks,
            reportComments: comments,
            submissionType: 'report',
          }),
        });

        if (!response.ok) throw new Error('Failed to submit marks');
      }
      
      toast.success(`Report marks submitted for ${selectedGroup.studentIds.length} students`);
      setShowGroupMarksModal(false);
      fetchCapstoneRecords();
    } catch (error) {
      console.error('Error submitting marks:', error);
      toast.error('Failed to submit marks');
    } finally {
      setSubmitting(false);
    }
  };

  const getFilteredCapstoneGroups = () => {
    if (!groupSearchQuery.trim()) {
      return capstoneGroups;
    }

    const query = groupSearchQuery.toLowerCase();
    return capstoneGroups.filter(
      (group) =>
        group.groupName.toLowerCase().includes(query) ||
        group.courseId?.code?.toLowerCase().includes(query) ||
        group.supervisorId?.name?.toLowerCase().includes(query) ||
        group.semester?.toLowerCase().includes(query) ||
        group.studentIds?.some(
          (s) =>
            s.name.toLowerCase().includes(query) ||
            s.studentId?.toLowerCase().includes(query)
        )
    );
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 backdrop-blur-md border-b bg-background/80">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/dashboard">
                <Image
                  src="/ulab.svg"
                  alt="ULAB Logo"
                  width={100}
                  height={100}
                  className="drop-shadow-lg cursor-pointer hover:opacity-80 transition-opacity"
                />
              </Link>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                  {semester} - {category} - Report Marks
                </h1>
                <p className="text-xs text-muted-foreground">
                  Submit report marks using rubric evaluation (0-3 per rubric, {getTotalMarksLimit(category)} total)
                </p>
              </div>
            </div>
            <Button variant="outline" asChild>
              <Link href={`/capstone/supervisor/${semester}`}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Link>
            </Button>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto p-4 pt-8">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Submit Report Marks - {category}</h2>
          <p className="text-muted-foreground">
            Evaluate capstone reports using {getRubrics(category).length} rubrics (0-3 points each, {getTotalMarksLimit(category)} total) for {semester}
          </p>
        </div>

        {/* Capstone Groups Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>All Capstone Groups</CardTitle>
            <CardDescription>
              Select a group to submit report marks using rubric evaluation
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {capstoneGroups.length === 0 ? (
              <p className="text-muted-foreground">No capstone groups found</p>
            ) : (
              <>
                <Input
                  placeholder="Search by group name, course, semester, supervisor, or student..."
                  value={groupSearchQuery}
                  onChange={(e) => setGroupSearchQuery(e.target.value)}
                  className="w-full"
                />

                <div className="space-y-3 max-h-96 overflow-y-auto border rounded-lg p-3">
                  {getFilteredCapstoneGroups().length > 0 ? (
                    getFilteredCapstoneGroups().map((group) => {
                      const firstStudentRecord = capstoneRecords.find(
                        (r) => r.studentId._id === group.studentIds[0]?._id
                      );
                      const hasSubmitted = !!firstStudentRecord?.reportRubrics;
                      const totalMarks = hasSubmitted 
                        ? calculateTotalMarks(firstStudentRecord.reportRubrics!) 
                        : 0;

                      return (
                        <div
                          key={group._id}
                          className={`p-4 bg-muted rounded-lg border transition-colors flex justify-between items-center gap-4 ${
                            selectedGroup?._id === group._id
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                              : 'border-border hover:border-blue-300'
                          }`}
                        >
                          <div className="flex-grow">
                            <div className="mb-2">
                              <p className="font-semibold text-sm">{group.groupName}</p>
                              <p className="text-xs text-muted-foreground">
                                {group.courseId?.code} • Course: {group.courseId?.name}
                                {group.semester && ` • Semester: ${group.semester}`}
                              </p>
                            </div>
                            <p className="text-xs text-muted-foreground mb-2">
                              Supervisor: <span className="font-medium">{group.supervisorId?.name}</span>
                            </p>
                            <div className="text-xs">
                              <p className="font-medium text-muted-foreground mb-1">Members:</p>
                              <ul className="space-y-1 pl-2">
                                {group.studentIds?.map((student) => (
                                  <li key={student._id} className="text-muted-foreground">
                                    • {student.name} ({student.studentId || student.rollNumber})
                                  </li>
                                ))}
                              </ul>
                            </div>
                            {hasSubmitted && (
                              <div className="mt-2 p-2 bg-green-100 dark:bg-green-950 rounded text-xs">
                                <p className="font-semibold text-green-800 dark:text-green-200">
                                  Marks: {totalMarks}/{getTotalMarksLimit(category)}
                                </p>
                              </div>
                            )}
                          </div>
                          <Button
                            onClick={() => handleOpenGroupMarksModal(group)}
                            variant={hasSubmitted ? 'outline' : 'default'}
                            size="sm"
                            className="flex-shrink-0 min-w-max whitespace-nowrap"
                          >
                            {hasSubmitted ? 'Edit Marks' : 'Submit Marks'}
                          </Button>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No groups match your search
                    </p>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Rubric Marking Modal */}
      <Dialog open={showGroupMarksModal} onOpenChange={setShowGroupMarksModal}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Submit Report Marks - {selectedGroup?.groupName}</DialogTitle>
            <DialogDescription>
              Group: {selectedGroup?.groupName} ({selectedGroup?.studentIds.length} students)
              <br />
              <span className="text-xs font-semibold text-blue-600 mt-1 block">
                These marks will be applied to all students in the group
              </span>
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* Group Members Display */}
            {selectedGroup && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm font-semibold mb-2">Applying to:</p>
                <div className="space-y-1">
                  {selectedGroup.studentIds.map((student) => (
                    <p key={student._id} className="text-sm">
                      • {student.name} ({student.rollNumber || student.studentId})
                    </p>
                  ))}
                </div>
              </div>
            )}

            {/* Rubric Tiles */}
            <div className="space-y-6">
              {getRubrics(category).map((rubric) => (
                <div key={rubric.key} className="space-y-3">
                  <div className="flex justify-between items-center">
                    <Label className="text-sm font-semibold">{rubric.label}</Label>
                    <span className="text-xs text-muted-foreground font-medium">
                      Selected: {rubrics[rubric.key as keyof ReportRubrics] !== undefined ? rubrics[rubric.key as keyof ReportRubrics] : '-'}
                    </span>
                  </div>
                  <div className="flex gap-3 justify-start">
                    {[0, 1, 2, 3].map((value) => (
                      <button
                        key={value}
                        onClick={() => {
                          setRubrics({
                            ...rubrics,
                            [rubric.key]: value,
                          });
                        }}
                        className={`w-16 h-16 flex items-center justify-center rounded-lg border-2 font-bold text-lg transition-all ${
                          rubrics[rubric.key as keyof ReportRubrics] === value
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400'
                            : 'border-border bg-muted hover:border-blue-300 hover:bg-blue-50/50 dark:hover:bg-blue-950/50 text-muted-foreground'
                        }`}
                      >
                        <div className="flex flex-col items-center gap-0.5">
                          <span>{value}</span>
                          {rubrics[rubric.key as keyof ReportRubrics] === value && (
                            <Check className="h-3 w-3" />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Total Marks Display */}
            <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-muted-foreground mb-2">Total Marks</p>
              <p className="text-5xl font-bold text-blue-700 dark:text-blue-300">
                {calculateTotalMarks(rubrics as any)} / {getTotalMarksLimit(category)}
              </p>
            </div>

            {/* Comments */}
            <div className="space-y-2">
              <Label htmlFor="comments">Comments (Optional)</Label>
              <textarea
                id="comments"
                placeholder="Add feedback or comments..."
                value={comments}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setComments(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-input rounded-md bg-transparent text-base placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowGroupMarksModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitGroupMarks} disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Marks'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
