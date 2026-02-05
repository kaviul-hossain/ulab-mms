'use client';

import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle, Users } from 'lucide-react';
import { toast } from 'sonner';

interface AssignedStudent {
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
  supervisorRole?: string;
  evaluatorRole?: string;
}

interface AssignedStudentsListProps {
  courseCode: string;
  role: 'supervisor' | 'evaluator';
}

export default function AssignedStudentsList({ courseCode, role }: AssignedStudentsListProps) {
  const { data: session } = useSession();
  const [students, setStudents] = useState<AssignedStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAssignedStudents();
  }, [courseCode, role, session]);

  const loadAssignedStudents = async () => {
    if (!session?.user?.id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.append('courseCode', courseCode);
      params.append('role', role);

      const response = await fetch(`/api/capstone/assigned-students?${params.toString()}`);
      const data = await response.json();

      if (Array.isArray(data)) {
        setStudents(data);
      } else if (data.error) {
        setError(data.error);
      }
    } catch (err: any) {
      setError('Failed to load assigned students');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (students.length === 0) {
    return (
      <Alert>
        <Users className="h-4 w-4" />
        <AlertDescription>
          No students have been assigned to you for {courseCode} yet. Check back later or contact your administrator.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Assigned Students ({students.length})</CardTitle>
        <CardDescription>
          Students assigned to you as {role} for {courseCode}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {students.map((assignment) => (
            <div
              key={assignment._id}
              className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="flex-1">
                <div className="font-medium">{assignment.studentId.name}</div>
                <div className="text-sm text-muted-foreground">
                  Roll: {assignment.studentId.studentId}
                </div>
              </div>
              <Badge variant="secondary">
                {role === 'supervisor' ? assignment.supervisorRole : assignment.evaluatorRole}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
