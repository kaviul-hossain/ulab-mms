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
import { Badge } from '@/components/ui/badge';
import { Loader2, ArrowLeft, Plus, Edit, CheckCircle2 } from 'lucide-react';
import Image from 'next/image';
import { toast } from 'sonner';

interface Student {
  _id: string;
  name: string;
  rollNumber?: string;
  studentId?: string;
}

interface CapstoneRecord {
  _id: string;
  studentId: Student;
  weeklyJournalMarks?: number;
  weeklyJournalComments?: string;
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

export default function WeeklyJournalPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const semester = params?.semester as string;
  const category = params?.category as string;
  const [students, setStudents] = useState<Student[]>([]);
  const [capstoneRecords, setCapstoneRecords] = useState<CapstoneRecord[]>([]);
  const [capstoneGroups, setCapstoneGroups] = useState<CapstoneGroup[]>([]);
  const [groupSearchQuery, setGroupSearchQuery] = useState<string>('');
  const [selectedGroup, setSelectedGroup] = useState<CapstoneGroup | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showGroupMarksModal, setShowGroupMarksModal] = useState(false);
  const [groupMarks, setGroupMarks] = useState<{ [studentId: string]: { marks: string; comments: string } }>({});
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [marks, setMarks] = useState('');
  const [comments, setComments] = useState('');
  const [courseId, setCourseId] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    } else if (status === 'authenticated') {
      fetchStudents();
      fetchCapstoneRecords();
      fetchCapstoneGroups();
    }
  }, [status, router]);

  const fetchStudents = async () => {
    try {
      const response = await fetch('/api/students');
      if (!response.ok) throw new Error('Failed to fetch students');
      const data = await response.json();
      setStudents(data);
    } catch (error) {
      console.error('Error fetching students:', error);
      toast.error('Failed to load students');
    }
  };

  const fetchCapstoneRecords = async () => {
    try {
      const response = await fetch(`/api/capstone?submissionType=weeklyJournal&courseCode=${category}`);
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
      // Build query parameters for filtering
      const params = new URLSearchParams({
        courseCode: category,
        semester: semester,
      });
      
      const response = await fetch(`/api/capstone-groups?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch groups');
      const data: CapstoneGroup[] = await response.json();
      setCapstoneGroups(data);
      // Extract courseId from first group for individual student marking
      if (data.length > 0) {
        setCourseId(data[0].courseId._id);
      }
    } catch (error) {
      console.error('Error fetching capstone groups:', error);
      toast.error('Failed to load capstone groups');
    }
  };

  const handleOpenModal = (student: Student) => {
    const existingRecord = capstoneRecords.find(
      (r) => r.studentId._id === student._id
    );
    setSelectedStudent(student);
    if (existingRecord) {
      setMarks(existingRecord.weeklyJournalMarks?.toString() || '');
      setComments(existingRecord.weeklyJournalComments || '');
    } else {
      setMarks('');
      setComments('');
    }
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!selectedStudent || marks === '') {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!courseId) {
      toast.error('Course information not loaded. Please refresh the page.');
      return;
    }

    const marksNum = parseFloat(marks);
    if (isNaN(marksNum) || marksNum < 0 || marksNum > 100) {
      toast.error('Marks must be between 0 and 100');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/capstone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: selectedStudent._id,
          supervisorId: session?.user?.id,
          courseId: courseId,
          weeklyJournalMarks: marksNum,
          weeklyJournalComments: comments,
          submissionType: 'weeklyJournal',
        }),
      });

      if (!response.ok) throw new Error('Failed to submit marks');
      
      toast.success('Marks submitted successfully');
      setShowModal(false);
      fetchCapstoneRecords();
    } catch (error) {
      console.error('Error submitting marks:', error);
      toast.error('Failed to submit marks');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitGroupMarks = async () => {
    if (!selectedGroup) return;

    // Validate all marks
    for (const studentId of selectedGroup.studentIds.map((s) => s._id)) {
      const marksStr = groupMarks[studentId]?.marks || '';
      if (marksStr === '') {
        toast.error('Please fill in all required marks');
        return;
      }
      const marksNum = parseFloat(marksStr);
      if (isNaN(marksNum) || marksNum < 0 || marksNum > 10) {
        toast.error('Weekly Journal marks must be between 0 and 10');
        return;
      }
    }

    setSubmitting(true);
    try {
      // Submit marks for all students in the group
      for (const student of selectedGroup.studentIds) {
        const marksNum = parseFloat(groupMarks[student._id]?.marks || '0');
        const commentsText = groupMarks[student._id]?.comments || '';

        const response = await fetch('/api/capstone', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            studentId: student._id,
            supervisorId: session?.user?.id,
            courseId: selectedGroup.courseId._id,
            groupId: selectedGroup._id,
            weeklyJournalMarks: marksNum,
            weeklyJournalComments: commentsText,
            submissionType: 'weeklyJournal',
          }),
        });

        if (!response.ok) throw new Error(`Failed to submit marks for ${student.name}`);
      }

      toast.success('All marks submitted successfully');
      setShowGroupMarksModal(false);
      setSelectedGroup(null);
      setGroupMarks({});
      fetchCapstoneRecords();
    } catch (error) {
      console.error('Error submitting group marks:', error);
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
                  {semester} - {category} - Weekly Journal Marks
                </h1>
                <p className="text-xs text-muted-foreground">
                  Submit weekly journal marks for {category} students
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
          <h2 className="text-3xl font-bold mb-2">Submit Weekly Journal Marks - {category}</h2>
          <p className="text-muted-foreground">
            Enter and manage weekly journal marks for your capstone students ({semester})
          </p>
        </div>

        {/* Capstone Groups Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>All Capstone Groups</CardTitle>
            <CardDescription>
              View all capstone groups in the system
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
                    getFilteredCapstoneGroups().map((group) => (
                      <div
                        key={group._id}
                        className={`p-3 bg-muted rounded-lg border transition-colors flex justify-between items-center gap-4 ${
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
                                  • {student.name} ({student.studentId})
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                        <Button
                          onClick={() => {
                            setSelectedGroup(group);
                            // Initialize groupMarks with existing records if any
                            const initialMarks: { [studentId: string]: { marks: string; comments: string } } = {};
                            group.studentIds?.forEach((student) => {
                              const existingRecord = capstoneRecords.find(
                                (r) => r.studentId._id === student._id
                              );
                              initialMarks[student._id] = {
                                marks: existingRecord?.weeklyJournalMarks?.toString() || '',
                                comments: existingRecord?.weeklyJournalComments || '',
                              };
                            });
                            setGroupMarks(initialMarks);
                            setShowGroupMarksModal(true);
                          }}
                          variant={selectedGroup?._id === group._id ? 'default' : 'outline'}
                          size="sm"
                          className="flex-shrink-0 min-w-max whitespace-nowrap"
                        >
                          Submit Marks
                        </Button>
                      </div>
                    ))
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

      {/* Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Submit Weekly Journal Marks</DialogTitle>
            <DialogDescription>
              {selectedStudent?.name} ({selectedStudent?.rollNumber})
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="marks">
                Marks (0-100) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="marks"
                type="number"
                min="0"
                max="100"
                step="0.5"
                placeholder="Enter marks"
                value={marks}
                onChange={(e) => setMarks(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="comments">Comments</Label>
              <textarea
                id="comments"
                placeholder="Add feedback or comments (optional)"
                value={comments}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setComments(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-input rounded-md bg-transparent text-base placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
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

      {/* Group Marks Modal */}
      <Dialog open={showGroupMarksModal} onOpenChange={setShowGroupMarksModal}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Submit Weekly Journal Marks - {selectedGroup?.groupName}</DialogTitle>
            <DialogDescription>
              Enter marks (0-10) for all students in this group
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedGroup?.studentIds?.map((student) => (
              <div key={student._id} className="border rounded-lg p-4 space-y-3">
                <div>
                  <h4 className="font-semibold text-sm">{student.name}</h4>
                  <p className="text-xs text-muted-foreground">{student.rollNumber} • {student.studentId}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor={`marks-${student._id}`}>
                      Marks (0-10) <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id={`marks-${student._id}`}
                      type="number"
                      min="0"
                      max="10"
                      step="0.5"
                      placeholder="Enter marks"
                      value={groupMarks[student._id]?.marks || ''}
                      onChange={(e) => {
                        setGroupMarks({
                          ...groupMarks,
                          [student._id]: {
                            ...groupMarks[student._id],
                            marks: e.target.value,
                          },
                        });
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`comments-${student._id}`}>Comments</Label>
                    <Input
                      id={`comments-${student._id}`}
                      placeholder="Add comments (optional)"
                      value={groupMarks[student._id]?.comments || ''}
                      onChange={(e) => {
                        setGroupMarks({
                          ...groupMarks,
                          [student._id]: {
                            ...groupMarks[student._id],
                            comments: e.target.value,
                          },
                        });
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
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
                'Submit All Marks'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
