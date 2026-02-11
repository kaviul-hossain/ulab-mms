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
  rollNumber: string;
}

interface CapstoneRecord {
  _id: string;
  studentId: Student;
  reportMarks?: number;
  reportComments?: string;
  createdAt: string;
}

export default function ReportPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const semester = params?.semester as string;
  const category = params?.category as string;
  const [students, setStudents] = useState<Student[]>([]);
  const [capstoneRecords, setCapstoneRecords] = useState<CapstoneRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [marks, setMarks] = useState('');
  const [comments, setComments] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    } else if (status === 'authenticated') {
      fetchStudents();
      fetchCapstoneRecords();
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
      const response = await fetch('/api/capstone?submissionType=report');
      if (!response.ok) throw new Error('Failed to fetch records');
      const data = await response.json();
      setCapstoneRecords(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching capstone records:', error);
      setLoading(false);
    }
  };

  const handleOpenModal = (student: Student) => {
    const existingRecord = capstoneRecords.find(
      (r) => r.studentId._id === student._id
    );
    setSelectedStudent(student);
    if (existingRecord) {
      setMarks(existingRecord.reportMarks?.toString() || '');
      setComments(existingRecord.reportComments || '');
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
          reportMarks: marksNum,
          reportComments: comments,
          submissionType: 'report',
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
                  Submit report marks for {category} students
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
            Enter and manage report marks for your capstone students ({semester})
          </p>
        </div>

        {/* Students Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {students.length > 0 ? (
            students.map((student) => {
              const record = capstoneRecords.find(
                (r) => r.studentId._id === student._id
              );
              const hasSubmitted = !!record?.reportMarks;

              return (
                <Card key={student._id} className="flex flex-col">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{student.name}</CardTitle>
                        <CardDescription>{student.rollNumber}</CardDescription>
                      </div>
                      {hasSubmitted && (
                        <Badge variant="default" className="bg-green-600">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Submitted
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="flex-grow">
                    {hasSubmitted && (
                      <div className="mb-4">
                        <p className="text-sm text-muted-foreground">Marks</p>
                        <p className="text-2xl font-bold text-blue-600">
                          {record?.reportMarks}/100
                        </p>
                        {record?.reportComments && (
                          <p className="text-sm mt-2 text-muted-foreground">
                            {record.reportComments}
                          </p>
                        )}
                      </div>
                    )}
                    <Button
                      onClick={() => handleOpenModal(student)}
                      className="w-full"
                      variant={hasSubmitted ? 'outline' : 'default'}
                    >
                      {hasSubmitted ? (
                        <>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Marks
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4 mr-2" />
                          Add Marks
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              );
            })
          ) : (
            <Card className="md:col-span-2 lg:col-span-3">
              <CardContent className="pt-6 text-center">
                <p className="text-muted-foreground">
                  No students available
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Submit Report Marks</DialogTitle>
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
    </div>
  );
}
