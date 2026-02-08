'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Plus } from 'lucide-react';
import { toast } from 'sonner';

interface Course {
  _id: string;
  name: string;
  code: string;
}

interface User {
  _id: string;
  name: string;
  email: string;
}

interface Student {
  _id: string;
  name: string;
  studentId: string;
}

interface CapstoneGroup {
  _id: string;
  groupName: string;
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
  studentIds: Array<{
    _id: string;
    name: string;
    studentId: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

interface FormData {
  title: string;
  courseId: string;
  supervisorId: string;
  numberOfMembers: number;
  students: Array<{ name: string; id: string }>;
}

export default function CapstoneManagement() {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  
  const [courses, setCourses] = useState<Course[]>([]);
  const [supervisors, setSupervisors] = useState<User[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [capstoneGroups, setCapstoneGroups] = useState<CapstoneGroup[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<CapstoneGroup | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');

  const [formData, setFormData] = useState<FormData>({
    title: '',
    courseId: '',
    supervisorId: '',
    numberOfMembers: 3,
    students: Array(3).fill({ name: '', id: '' }),
  });

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoadingData(true);
    try {
      // Load courses
      const coursesRes = await fetch('/api/courses');
      const coursesData = await coursesRes.json();
      if (coursesData.courses && Array.isArray(coursesData.courses)) {
        setCourses(coursesData.courses);
      }

      // Load supervisors (users)
      const usersRes = await fetch('/api/auth/users');
      const usersData = await usersRes.json();
      if (Array.isArray(usersData)) {
        setSupervisors(usersData);
      }

      // Load all students
      const studentsRes = await fetch('/api/students');
      const studentsData = await studentsRes.json();
      if (Array.isArray(studentsData)) {
        setStudents(studentsData);
      }

      // Load capstone groups
      await loadCapstoneGroups();
    } catch (err) {
      console.error('Failed to load initial data:', err);
      toast.error('Failed to load data');
    } finally {
      setLoadingData(false);
    }
  };

  const loadCapstoneGroups = async () => {
    try {
      const response = await fetch('/api/admin/capstone-group');
      const data = await response.json();
      if (Array.isArray(data)) {
        setCapstoneGroups(data);
      }
    } catch (err) {
      console.error('Failed to load capstone groups:', err);
    }
  };

  const handleNumberOfMembersChange = (num: number) => {
    if (num < 3 || num > 6) return;
    
    const newStudents = Array(num).fill({ name: '', id: '' });
    // Preserve existing student data if downscaling
    for (let i = 0; i < Math.min(num, formData.students.length); i++) {
      newStudents[i] = formData.students[i];
    }
    
    setFormData({
      ...formData,
      numberOfMembers: num,
      students: newStudents,
    });
  };

  const handleStudentChange = (index: number, field: 'name' | 'id', value: string) => {
    const newStudents = [...formData.students];
    newStudents[index] = {
      ...newStudents[index],
      [field]: value,
    };
    setFormData({
      ...formData,
      students: newStudents,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.title.trim()) {
      toast.error('Please enter a group title');
      return;
    }
    if (!formData.courseId) {
      toast.error('Please select a course');
      return;
    }
    if (!formData.supervisorId) {
      toast.error('Please select a supervisor');
      return;
    }

    // Check all students are selected
    const allStudentsSelected = formData.students.every(s => s.name && s.id);
    if (!allStudentsSelected) {
      toast.error('Please select all student names and IDs');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/admin/capstone-group', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': localStorage.getItem('adminPassword') || '',
        },
        body: JSON.stringify({
          groupName: formData.title,
          courseId: formData.courseId,
          supervisorId: formData.supervisorId,
          studentIds: formData.students.map(s => s.name), // Send actual student _ids
        }),
      });

      if (response.ok) {
        toast.success('Capstone group created successfully');
        setShowCreateDialog(false);
        setFormData({
          title: '',
          courseId: '',
          supervisorId: '',
          numberOfMembers: 3,
          students: Array(3).fill({ name: '', id: '' }),
        });
        // Reload groups list
        await loadCapstoneGroups();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to create group');
      }
    } catch (err) {
      console.error('Error creating group:', err);
      toast.error('Failed to create group');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseDialog = () => {
    setShowCreateDialog(false);
    setFormData({
      title: '',
      courseId: '',
      supervisorId: '',
      numberOfMembers: 3,
      students: Array(3).fill({ name: '', id: '' }),
    });
  };

  if (loadingData) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const handleGroupSelect = (groupId: string) => {
    const group = capstoneGroups.find((g) => g._id === groupId);
    if (group) {
      setSelectedGroup(group);
      setShowDetailsDialog(true);
    }
    setSelectedGroupId('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Capstone Management</h2>
      </div>

      {/* Create Groups Card */}
      <Card>
        <CardHeader>
          <CardTitle>Create Capstone Groups</CardTitle>
          <CardDescription>
            Create a new capstone group with students and a supervisor
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => setShowCreateDialog(true)} size="lg" className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Create Capstone Groups
          </Button>
        </CardContent>
      </Card>

      {/* View Groups Dropdown Card */}
      <Card>
        <CardHeader>
          <CardTitle>View Capstone Groups</CardTitle>
          <CardDescription>
            Select a group to view its details
          </CardDescription>
        </CardHeader>
        <CardContent>
          {capstoneGroups.length === 0 ? (
            <p className="text-muted-foreground">No capstone groups created yet</p>
          ) : (
            <Select value={selectedGroupId} onValueChange={handleGroupSelect}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Capstone Groups" />
              </SelectTrigger>
              <SelectContent>
                {capstoneGroups.map((group) => (
                  <SelectItem key={group._id} value={group._id}>
                    {group.groupName} ({group.courseId?.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </CardContent>
      </Card>

      {/* Create Group Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={(open) => {
        if (!open) handleCloseDialog();
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Capstone Group</DialogTitle>
            <DialogDescription>
              Fill in the group details and select students
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title Field */}
            <div>
              <Label htmlFor="title" className="font-semibold">
                Title <span className="text-red-500">*</span>
              </Label>
              <Input
                id="title"
                placeholder="Enter group title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                className="mt-1"
              />
            </div>

            {/* Course Selection */}
            <div>
              <Label htmlFor="courseId" className="font-semibold">
                Course <span className="text-red-500">*</span>
              </Label>
              <select
                id="courseId"
                value={formData.courseId}
                onChange={(e) => setFormData({ ...formData, courseId: e.target.value })}
                className="w-full px-3 py-2 border rounded-md mt-1"
                required
              >
                <option value="">Select a course</option>
                {courses.map((course) => (
                  <option key={course._id} value={course._id}>
                    {course.code} - {course.name}
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
                className="w-full px-3 py-2 border rounded-md mt-1"
                required
              >
                <option value="">Select a supervisor</option>
                {supervisors.map((supervisor) => (
                  <option key={supervisor._id} value={supervisor._id}>
                    {supervisor.name} ({supervisor.email})
                  </option>
                ))}
              </select>
            </div>

            {/* Number of Members */}
            <div>
              <Label htmlFor="numberOfMembers" className="font-semibold">
                Number of Members <span className="text-red-500">*</span>
              </Label>
              <div className="flex items-center gap-4 mt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleNumberOfMembersChange(formData.numberOfMembers - 1)}
                  disabled={formData.numberOfMembers <= 3}
                >
                  -
                </Button>
                <span className="text-center font-semibold text-lg w-12">
                  {formData.numberOfMembers}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleNumberOfMembersChange(formData.numberOfMembers + 1)}
                  disabled={formData.numberOfMembers >= 6}
                >
                  +
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Select between 3 and 6 members
              </p>
            </div>

            {/* Student Fields */}
            <div className="space-y-4">
              <Label className="font-semibold">Students <span className="text-red-500">*</span></Label>
              {formData.students.map((student, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-3">
                  <h4 className="font-medium">Student {index + 1}</h4>
                  
                  {/* Student Name Dropdown */}
                  <div>
                    <Label htmlFor={`student-name-${index}`} className="text-sm">
                      Student Name <span className="text-red-500">*</span>
                    </Label>
                    <select
                      id={`student-name-${index}`}
                      value={student.name}
                      onChange={(e) => handleStudentChange(index, 'name', e.target.value)}
                      className="w-full px-3 py-2 border rounded-md mt-1 text-sm"
                      required
                    >
                      <option value="">Select student name</option>
                      {students.map((s) => (
                        <option key={s._id} value={s._id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Student ID Dropdown */}
                  <div>
                    <Label htmlFor={`student-id-${index}`} className="text-sm">
                      Student ID <span className="text-red-500">*</span>
                    </Label>
                    <select
                      id={`student-id-${index}`}
                      value={student.id}
                      onChange={(e) => handleStudentChange(index, 'id', e.target.value)}
                      className="w-full px-3 py-2 border rounded-md mt-1 text-sm"
                      required
                    >
                      <option value="">Select student ID</option>
                      {students.map((s) => (
                        <option key={s._id} value={s.studentId}>
                          {s.studentId}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}
            </div>

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseDialog}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Create Group
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Group Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedGroup?.groupName}</DialogTitle>
            <DialogDescription>
              Capstone group details and members
            </DialogDescription>
          </DialogHeader>

          {selectedGroup && (
            <div className="space-y-6">
              {/* Course Information */}
              <div>
                <h3 className="font-semibold mb-3">Course Information</h3>
                <div className="grid gap-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Course Code:</span>
                    <span className="font-medium">{selectedGroup.courseId?.code}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Course Name:</span>
                    <span className="font-medium">{selectedGroup.courseId?.name}</span>
                  </div>
                </div>
              </div>

              {/* Supervisor Information */}
              <div>
                <h3 className="font-semibold mb-3">Supervisor</h3>
                <div className="grid gap-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Name:</span>
                    <span className="font-medium">{selectedGroup.supervisorId?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Email:</span>
                    <span className="font-medium">{selectedGroup.supervisorId?.email}</span>
                  </div>
                </div>
              </div>

              {/* Group Members */}
              <div>
                <h3 className="font-semibold mb-3">Group Members ({selectedGroup.studentIds?.length || 0})</h3>
                <div className="border rounded-lg divide-y">
                  {selectedGroup.studentIds && selectedGroup.studentIds.length > 0 ? (
                    selectedGroup.studentIds.map((student, index) => (
                      <div key={student._id} className="p-3 flex justify-between items-center text-sm">
                        <span className="font-medium">{student.name}</span>
                        <span className="text-muted-foreground">{student.studentId}</span>
                      </div>
                    ))
                  ) : (
                    <div className="p-3 text-sm text-muted-foreground">
                      No students in this group
                    </div>
                  )}
                </div>
              </div>

              {/* Timeline */}
              <div>
                <h3 className="font-semibold mb-3">Timeline</h3>
                <div className="grid gap-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Created:</span>
                    <span className="font-medium">
                      {new Date(selectedGroup.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Last Updated:</span>
                    <span className="font-medium">
                      {new Date(selectedGroup.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailsDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
