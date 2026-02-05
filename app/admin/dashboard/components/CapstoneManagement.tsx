'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Plus, Edit2, Trash2, RefreshCw, Users, FolderOpen } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import GroupManagement from './GroupManagement';

interface CapstoneMarks {
  _id: string;
  studentId: {
    _id: string;
    name: string;
    rollNumber: string;
  };
  supervisorId: {
    _id: string;
    name: string;
    email: string;
  };
  evaluatorId?: {
    _id: string;
    name: string;
    email: string;
  };
  supervisorMarks?: number;
  supervisorComments?: string;
  evaluatorMarks?: number;
  evaluatorComments?: string;
  submissionType: 'proposal' | 'midterm' | 'final';
  createdAt: string;
  updatedAt: string;
}

interface CapstoneAssignment {
  _id: string;
  studentId: {
    _id: string;
    name: string;
    studentId: string;
  };
  courseId: {
    _id: string;
    name: string;
    code: string;
  };
  supervisorId: {
    _id: string;
    name: string;
    email: string;
  };
  evaluatorId?: {
    _id: string;
    name: string;
    email: string;
  };
  supervisorRole: 'supervisor' | 'evaluator' | 'both';
  evaluatorRole: 'supervisor' | 'evaluator' | 'both';
  createdAt: string;
  updatedAt: string;
}

interface User {
  _id: string;
  name: string;
  email: string;
}

interface Course {
  _id: string;
  name: string;
  code: string;
  semester?: string;
  year?: number;
}

interface Student {
  _id: string;
  name: string;
  studentId: string;
}

const CAPSTONE_COURSES = ['CSE4098A', 'CSE4098B', 'CSE4098C', 'CSE499'];

export default function CapstoneManagement() {
  // Marks Tab State
  const [capstoneMarks, setCapstoneMarks] = useState<CapstoneMarks[]>([]);
  const [marksLoading, setMarksLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('');

  // Assignment Tab State
  const [assignments, setAssignments] = useState<CapstoneAssignment[]>([]);
  const [assignmentsLoading, setAssignmentsLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<CapstoneAssignment | null>(null);
  const [filterCourse, setFilterCourse] = useState<string>('');
  const [filterUser, setFilterUser] = useState<string>('');

  // Form states
  const [formData, setFormData] = useState({
    courseId: '',
    studentId: '',
    supervisorId: '',
    evaluatorId: '',
    supervisorRole: 'supervisor' as 'supervisor' | 'evaluator' | 'both',
    evaluatorRole: 'evaluator' as 'supervisor' | 'evaluator' | 'both',
  });

  const [courses, setCourses] = useState<Course[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loadingDropdowns, setLoadingDropdowns] = useState(false);

  // Load both marks and assignments on mount
  useEffect(() => {
    loadCapstoneMarks();
    loadAssignments();
    loadDropdowns();
  }, [filterType, filterCourse, filterUser]);

  // ==================== MARKS TAB FUNCTIONS ====================

  const loadCapstoneMarks = async () => {
    setMarksLoading(true);
    try {
      const url = filterType 
        ? `/api/capstone?submissionType=${filterType}`
        : '/api/capstone';
      
      const response = await fetch(url);
      const data = await response.json();

      if (Array.isArray(data)) {
        setCapstoneMarks(data);
      } else {
        toast.error('Failed to load capstone marks');
      }
    } catch (err: any) {
      toast.error('Failed to load capstone marks');
    } finally {
      setMarksLoading(false);
    }
  };

  const handleDeleteMark = async (id: string) => {
    if (!confirm('Are you sure you want to delete this capstone record?')) {
      return;
    }

    try {
      const response = await fetch(`/api/capstone/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Capstone record deleted successfully');
        loadCapstoneMarks();
      } else {
        toast.error('Failed to delete capstone record');
      }
    } catch (err: any) {
      toast.error('Failed to delete capstone record');
    }
  };

  const getSubmissionTypeColor = (type: string) => {
    switch (type) {
      case 'proposal':
        return 'bg-blue-100 text-blue-800';
      case 'midterm':
        return 'bg-yellow-100 text-yellow-800';
      case 'final':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getAverageMarks = (mark: CapstoneMarks) => {
    const marks = [];
    if (mark.supervisorMarks !== undefined) marks.push(mark.supervisorMarks);
    if (mark.evaluatorMarks !== undefined) marks.push(mark.evaluatorMarks);
    
    if (marks.length === 0) return 'N/A';
    return (marks.reduce((a, b) => a + b, 0) / marks.length).toFixed(2);
  };

  // ==================== ASSIGNMENT TAB FUNCTIONS ====================

  const loadAssignments = async () => {
    setAssignmentsLoading(true);
    try {
      let url = '/api/admin/capstone-assignment';
      const params = new URLSearchParams();

      if (filterCourse) params.append('courseId', filterCourse);
      if (filterUser) params.append('userId', filterUser);

      if (params.toString()) url += '?' + params.toString();

      const response = await fetch(url);
      const data = await response.json();

      if (Array.isArray(data)) {
        setAssignments(data);
      } else {
        toast.error('Failed to load assignments');
      }
    } catch (err: any) {
      toast.error('Failed to load assignments');
    } finally {
      setAssignmentsLoading(false);
    }
  };

  const loadDropdowns = async () => {
    setLoadingDropdowns(true);
    try {
      // Load ALL courses from the system
      const coursesResponse = await fetch('/api/courses');
      const coursesData = await coursesResponse.json();
      
      if (coursesData.courses && Array.isArray(coursesData.courses)) {
        // Load all courses without filtering
        console.log('Found total courses:', coursesData.courses.length);
        setCourses(coursesData.courses);
      } else if (Array.isArray(coursesData)) {
        // Handle direct array response
        console.log('Found total courses:', coursesData.length);
        setCourses(coursesData);
      }

      // Load users (supervisors and evaluators) - not students
      // For the assignment form, we need user accounts, not enrolled students
      const usersResponse = await fetch('/api/auth/users');
      const usersData = await usersResponse.json();
      if (Array.isArray(usersData)) {
        setUsers(usersData);
      } else if (usersData && Array.isArray(usersData.users)) {
        setUsers(usersData.users);
      }
    } catch (err) {
      console.error('Failed to load dropdowns:', err);
      // Fallback: try to get users from students endpoint as fallback
      try {
        const fallbackResponse = await fetch('/api/students');
        const fallbackData = await fallbackResponse.json();
        if (Array.isArray(fallbackData)) {
          setUsers(fallbackData);
        }
      } catch (fallbackErr) {
        console.error('Fallback users load also failed:', fallbackErr);
      }
    } finally {
      setLoadingDropdowns(false);
    }
  };

  const loadStudents = async (courseId: string) => {
    try {
      const response = await fetch(`/api/courses/${courseId}`);
      const data = await response.json();
      if (data.students) {
        setStudents(data.students);
      }
    } catch (err) {
      console.error('Failed to load students:', err);
    }
  };

  const handleCourseChange = (courseId: string) => {
    setFormData({ ...formData, courseId });
    if (courseId) {
      loadStudents(courseId);
    } else {
      setStudents([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.courseId || !formData.studentId || !formData.supervisorId) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const response = await fetch('/api/admin/capstone-assignment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success(selectedAssignment ? 'Assignment updated successfully' : 'Assignment created successfully');
        setShowAddDialog(false);
        setSelectedAssignment(null);
        setFormData({
          courseId: '',
          studentId: '',
          supervisorId: '',
          evaluatorId: '',
          supervisorRole: 'supervisor',
          evaluatorRole: 'evaluator',
        });
        loadAssignments();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to save assignment');
      }
    } catch (err: any) {
      toast.error('Failed to save assignment');
    }
  };

  const handleDeleteAssignment = async (id: string) => {
    if (!confirm('Are you sure you want to remove this assignment?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/capstone-assignment?id=${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Assignment removed successfully');
        loadAssignments();
      } else {
        toast.error('Failed to remove assignment');
      }
    } catch (err: any) {
      toast.error('Failed to remove assignment');
    }
  };

  const handleEdit = (assignment: CapstoneAssignment) => {
    setSelectedAssignment(assignment);
    setFormData({
      courseId: assignment.courseId._id,
      studentId: assignment.studentId._id,
      supervisorId: assignment.supervisorId._id,
      evaluatorId: assignment.evaluatorId?._id || '',
      supervisorRole: assignment.supervisorRole as 'supervisor' | 'evaluator' | 'both',
      evaluatorRole: assignment.evaluatorRole as 'supervisor' | 'evaluator' | 'both',
    });
    loadStudents(assignment.courseId._id);
    setShowAddDialog(true);
  };

  const handleCloseDialog = () => {
    setShowAddDialog(false);
    setSelectedAssignment(null);
    setFormData({
      courseId: '',
      studentId: '',
      supervisorId: '',
      evaluatorId: '',
      supervisorRole: 'supervisor',
      evaluatorRole: 'evaluator',
    });
    setStudents([]);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Capstone Management</h2>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="groups" className="w-full">
        <TabsList>
          <TabsTrigger value="groups" className="flex items-center gap-2">
            <FolderOpen className="h-4 w-4" />
            Groups
          </TabsTrigger>
          <TabsTrigger value="marks">Capstone Marks</TabsTrigger>
        </TabsList>
        {/* ==================== GROUPS TAB ==================== */}
        <TabsContent value="groups" className="space-y-6">
          <GroupManagement onGroupsUpdated={() => {}} />
        </TabsContent>

        {/* ==================== MARKS TAB ==================== */}
        <TabsContent value="marks" className="space-y-6">
          {/* Filter */}
          <div className="flex gap-4 items-center">
            <div className="flex items-center gap-2">
              <Label htmlFor="filter-type">Filter by Type:</Label>
              <select
                id="filter-type"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-2 border rounded-md text-sm"
              >
                <option value="">All Types</option>
                <option value="proposal">Proposal</option>
                <option value="midterm">Midterm</option>
                <option value="final">Final</option>
              </select>
            </div>
            <Button onClick={loadCapstoneMarks} disabled={marksLoading} variant="outline" size="sm">
              <RefreshCw className={`h-4 w-4 mr-2 ${marksLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          {/* Capstone Records Card */}
          <Card>
            <CardHeader>
              <CardTitle>Capstone Records</CardTitle>
              <CardDescription>
                View student capstone submissions and supervisor/evaluator marks
              </CardDescription>
            </CardHeader>
            <CardContent>
              {marksLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : capstoneMarks.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <p>No capstone records found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-semibold">Student</th>
                        <th className="text-left py-3 px-4 font-semibold">Roll No.</th>
                        <th className="text-left py-3 px-4 font-semibold">Type</th>
                        <th className="text-left py-3 px-4 font-semibold">Supervisor</th>
                        <th className="text-center py-3 px-4 font-semibold">Supervisor Marks</th>
                        <th className="text-center py-3 px-4 font-semibold">Evaluator Marks</th>
                        <th className="text-center py-3 px-4 font-semibold">Average</th>
                        <th className="text-right py-3 px-4 font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {capstoneMarks.map((mark) => (
                        <tr key={mark._id} className="border-b hover:bg-muted/50 transition-colors">
                          <td className="py-3 px-4 font-medium">{mark.studentId.name}</td>
                          <td className="py-3 px-4 text-muted-foreground">{mark.studentId.rollNumber}</td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 rounded text-xs font-semibold ${getSubmissionTypeColor(mark.submissionType)}`}>
                              {mark.submissionType.charAt(0).toUpperCase() + mark.submissionType.slice(1)}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-muted-foreground">{mark.supervisorId.name}</td>
                          <td className="py-3 px-4 text-center font-medium">
                            {mark.supervisorMarks !== undefined ? mark.supervisorMarks : 'N/A'}
                          </td>
                          <td className="py-3 px-4 text-center font-medium">
                            {mark.evaluatorMarks !== undefined ? mark.evaluatorMarks : 'N/A'}
                          </td>
                          <td className="py-3 px-4 text-center font-semibold text-blue-600">
                            {getAverageMarks(mark)}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex gap-2 justify-end">
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDeleteMark(mark._id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Marks Statistics Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Statistics</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Records:</span>
                <span className="font-medium">{capstoneMarks.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Proposals:</span>
                <span className="font-medium">{capstoneMarks.filter(m => m.submissionType === 'proposal').length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Midterm:</span>
                <span className="font-medium">{capstoneMarks.filter(m => m.submissionType === 'midterm').length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Final:</span>
                <span className="font-medium">{capstoneMarks.filter(m => m.submissionType === 'final').length}</span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add/Edit Assignment Dialog */}
      <Dialog open={showAddDialog} onOpenChange={(open) => {
        if (!open) handleCloseDialog();
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedAssignment ? 'Edit Assignment' : 'Assign Student to Supervisor/Evaluator'}
            </DialogTitle>
            <DialogDescription>
              {selectedAssignment
                ? 'Update the assignment details'
                : 'Select a capstone course, student, and supervisor/evaluator'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Course Selection */}
            <div>
              <Label htmlFor="courseId" className="font-semibold">
                Course <span className="text-red-500">*</span>
              </Label>
              <select
                id="courseId"
                value={formData.courseId}
                onChange={(e) => handleCourseChange(e.target.value)}
                disabled={loadingDropdowns}
                className="w-full px-3 py-2 border rounded-md mt-1"
                required
              >
                <option value="">Select a capstone course</option>
                {courses.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.code} - {c.name} {c.year && c.semester ? `(${c.semester} ${c.year})` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Student Selection */}
            <div>
              <Label htmlFor="studentId" className="font-semibold">
                Student <span className="text-red-500">*</span>
              </Label>
              <select
                id="studentId"
                value={formData.studentId}
                onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                disabled={!formData.courseId || students.length === 0}
                className="w-full px-3 py-2 border rounded-md mt-1"
                required
              >
                <option value="">
                  {students.length === 0 ? 'Select a course first' : 'Select a student'}
                </option>
                {students.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name} ({s.studentId})
                  </option>
                ))}
              </select>
            </div>

            {/* Supervisor Selection */}
            <div>
              <Label htmlFor="supervisorId" className="font-semibold">
                Supervisor <span className="text-red-500">*</span>
              </Label>
              <select
                id="supervisorId"
                value={formData.supervisorId}
                onChange={(e) => setFormData({ ...formData, supervisorId: e.target.value })}
                disabled={loadingDropdowns}
                className="w-full px-3 py-2 border rounded-md mt-1"
                required
              >
                <option value="">Select a supervisor</option>
                {users.map((u) => (
                  <option key={u._id} value={u._id}>
                    {u.name} ({u.email})
                  </option>
                ))}
              </select>
            </div>

            {/* Supervisor Role */}
            <div>
              <Label htmlFor="supervisorRole" className="font-semibold">
                Supervisor Role
              </Label>
              <select
                id="supervisorRole"
                value={formData.supervisorRole}
                onChange={(e) => setFormData({ ...formData, supervisorRole: e.target.value as any })}
                className="w-full px-3 py-2 border rounded-md mt-1"
              >
                <option value="supervisor">Supervisor</option>
                <option value="evaluator">Evaluator</option>
                <option value="both">Both (Supervisor & Evaluator)</option>
              </select>
            </div>

            {/* Evaluator Selection */}
            <div>
              <Label htmlFor="evaluatorId" className="font-semibold">
                Evaluator (Optional)
              </Label>
              <select
                id="evaluatorId"
                value={formData.evaluatorId}
                onChange={(e) => setFormData({ ...formData, evaluatorId: e.target.value })}
                disabled={loadingDropdowns}
                className="w-full px-3 py-2 border rounded-md mt-1"
              >
                <option value="">No evaluator</option>
                {users.map((u) => (
                  <option key={u._id} value={u._id}>
                    {u.name} ({u.email})
                  </option>
                ))}
              </select>
            </div>

            {/* Evaluator Role */}
            {formData.evaluatorId && (
              <div>
                <Label htmlFor="evaluatorRole" className="font-semibold">
                  Evaluator Role
                </Label>
                <select
                  id="evaluatorRole"
                  value={formData.evaluatorRole}
                  onChange={(e) => setFormData({ ...formData, evaluatorRole: e.target.value as any })}
                  className="w-full px-3 py-2 border rounded-md mt-1"
                >
                  <option value="evaluator">Evaluator</option>
                  <option value="supervisor">Supervisor</option>
                  <option value="both">Both (Supervisor & Evaluator)</option>
                </select>
              </div>
            )}

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseDialog}
              >
                Cancel
              </Button>
              <Button type="submit">
                {selectedAssignment ? 'Update Assignment' : 'Assign Student'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
