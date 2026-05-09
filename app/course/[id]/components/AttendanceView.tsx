"use client";

import { Fragment, useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ChevronDown, ChevronRight, QrCode, Trash2 } from 'lucide-react';

interface AttendanceRecord {
  studentId: string;
  status: 'present' | 'absent';
  recordedAt: string;
  markedBy?: 'qr' | 'manual';
  studentIdString?: string;
}

interface Session {
  _id: string;
  date: string;
  open: boolean;
  records: AttendanceRecord[];
}

interface Student {
  _id: string;
  studentId: string;
  name: string;
}

type SessionStatus = 'present' | 'absent' | 'none';

function buildQrUrl(courseId: string) {
  if (typeof window === 'undefined') return `/attendance/checkin/${courseId}`;
  return `${window.location.origin}/attendance/checkin/${courseId}`;
}

function getLocalDateInputValue(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function AttendanceView({ courseId }: { courseId: string }) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [activeSession, setActiveSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedStudentId, setExpandedStudentId] = useState<string | null>(null);
  const [showQrModal, setShowQrModal] = useState(false);
  const [showManageModal, setShowManageModal] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [showSessionDialog, setShowSessionDialog] = useState(false);
  const [sessionDate, setSessionDate] = useState(getLocalDateInputValue());

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [attendanceRes, courseRes] = await Promise.all([
        fetch(`/api/courses/${courseId}/attendance`),
        fetch(`/api/courses/${courseId}`),
      ]);

      const attendanceData = await attendanceRes.json();
      const courseData = await courseRes.json();

      if (attendanceRes.ok) {
        setSessions(attendanceData.sessions || []);
        setActiveSession(attendanceData.activeSession || null);
      }

      if (courseRes.ok) {
        setStudents(courseData.students || []);
      }
    } catch (err) {
      console.error('Error fetching attendance data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (courseId) fetchAll();
  }, [courseId]);

  const sessionLabels = useMemo(
    () => sessions.map((session) => ({
      ...session,
      label: new Date(session.date).toLocaleDateString(),
    })),
    [sessions]
  );

  const toggleAttendance = async () => {
    if (!isActive) {
      setSessionDate(getLocalDateInputValue());
      setShowSessionDialog(true);
      return;
    }

    try {
      const res = await fetch(`/api/courses/${courseId}/attendance`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        await fetchAll();
      } else {
        console.error(data.error || 'Unable to toggle attendance');
      }
    } catch (err) {
      console.error('Error toggling attendance', err);
    }
  };

  const openSessionWithDate = async () => {
    try {
      const res = await fetch(`/api/courses/${courseId}/attendance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: sessionDate }),
      });
      const data = await res.json();
      if (res.ok) {
        setShowSessionDialog(false);
        await fetchAll();
      } else {
        console.error(data.error || 'Unable to open attendance session');
      }
    } catch (err) {
      console.error('Error opening attendance session', err);
    }
  };

  const updateStudentStatus = async (sessionId: string, studentId: string, status: 'present' | 'absent') => {
    try {
      const res = await fetch(`/api/courses/${courseId}/attendance`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, studentId, status }),
      });

      if (res.ok) {
        await fetchAll();
      }
    } catch (err) {
      console.error('Error updating attendance', err);
    }
  };

  const deleteSession = async (sessionId: string) => {
    try {
      const res = await fetch(`/api/courses/${courseId}/attendance/${sessionId}`, { method: 'DELETE' });
      if (res.ok) {
        setDeleteConfirmId(null);
        await fetchAll();
      }
    } catch (err) {
      console.error('Error deleting session', err);
    }
  };

  const getStatus = (session: Session, student: Student): SessionStatus => {
    const record = session.records?.find((item) => String(item.studentId) === String(student._id));
    return record?.status || 'none';
  };

  const countsForSession = (session: Session) => {
    const present = session.records?.filter((item) => item.status === 'present').length || 0;
    const absent = session.records?.filter((item) => item.status === 'absent').length || 0;
    return { present, absent };
  };

  const isActive = Boolean(activeSession?.open);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h3 className="text-2xl font-semibold">Attendance</h3>
          <p className="text-sm text-muted-foreground">Toggle a class session on, then use QR or manual present/absent updates.</p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            onClick={toggleAttendance}
            className={isActive ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-slate-500 hover:bg-slate-600 text-white'}
          >
            {isActive ? 'Close Session' : 'Open Session'}
          </Button>

          <Button type="button" variant="outline" onClick={() => setShowQrModal(true)} disabled={!isActive}>
            <QrCode className="mr-2 h-4 w-4" />
            QR Code
          </Button>

          <Button type="button" variant="outline" onClick={() => setShowManageModal(true)}>
            Manage class session
          </Button>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[260px]">Student</TableHead>
                <TableHead className="min-w-40">Present / Absent</TableHead>
                {sessionLabels.map((session) => (
                  <TableHead key={session._id} className="text-center min-w-40">
                    {session.label}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>

            <TableBody>
              {students.map((student) => {
                const isExpanded = expandedStudentId === student._id;
                const studentSessions = sessionLabels.map((session) => ({
                  ...session,
                  status: getStatus(session, student),
                }));
                const presentCount = studentSessions.filter((item) => item.status === 'present').length;
                const absentCount = studentSessions.filter((item) => item.status === 'absent').length;

                return (
                  <Fragment key={student._id}>
                    <TableRow key={student._id}>
                      <TableCell>
                        <button
                          type="button"
                          onClick={() => setExpandedStudentId(isExpanded ? null : student._id)}
                          className="flex items-center gap-2 text-left font-medium hover:underline"
                        >
                          {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                          <span>{student.name}</span>
                          <span className="text-muted-foreground">({student.studentId})</span>
                        </button>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">Present {presentCount} / Absent {absentCount}</Badge>
                      </TableCell>
                      {sessionLabels.map((session) => {
                        const status = getStatus(session, student);
                        return (
                          <TableCell key={session._id} className="text-center">
                            {status === 'present' ? (
                              <Badge className="bg-green-600 hover:bg-green-600">Present</Badge>
                            ) : status === 'absent' ? (
                              <Badge variant="destructive">Absent</Badge>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                        );
                      })}
                    </TableRow>

                    {isExpanded && (
                      <TableRow key={`${student._id}-expanded`}>
                        <TableCell colSpan={2 + sessionLabels.length} className="bg-muted/30">
                          <div className="space-y-3">
                            <div className="text-sm font-medium">Attendance by date</div>
                            <div className="space-y-2">
                              {sessionLabels.length === 0 ? (
                                <div className="text-sm text-muted-foreground">No sessions yet.</div>
                              ) : (
                                sessionLabels.map((session) => {
                                  const status = getStatus(session, student);
                                  return (
                                    <div key={session._id} className="flex items-center justify-between gap-3 rounded-md border bg-background px-3 py-2">
                                      <div className="min-w-0">
                                        <div className="font-medium">{session.label}</div>
                                        <div className="text-xs text-muted-foreground">
                                          {status === 'present' ? 'Marked present' : status === 'absent' ? 'Marked absent' : 'Not marked yet'}
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <Button
                                          size="sm"
                                          variant={status === 'present' ? 'default' : 'outline'}
                                          onClick={() => updateStudentStatus(session._id, student._id, 'present')}
                                        >
                                          Present
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant={status === 'absent' ? 'destructive' : 'outline'}
                                          onClick={() => updateStudentStatus(session._id, student._id, 'absent')}
                                        >
                                          Absent
                                        </Button>
                                      </div>
                                    </div>
                                  );
                                })
                              )}
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={showQrModal} onOpenChange={setShowQrModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Attendance QR</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-4">
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=420x420&data=${encodeURIComponent(buildQrUrl(courseId))}`}
              alt="Attendance QR"
              className="rounded-xl border bg-white p-3"
            />
            <div className="break-all text-xs text-muted-foreground">{buildQrUrl(courseId)}</div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showSessionDialog} onOpenChange={setShowSessionDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Choose class date</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label htmlFor="attendance-date" className="text-sm font-medium">
                Session date
              </label>
              <input
                id="attendance-date"
                type="date"
                value={sessionDate}
                onChange={(e) => setSessionDate(e.target.value)}
                className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
            </div>

            <p className="text-sm text-muted-foreground">
              Select the actual class date. This is useful for makeup classes or any attendance session that is not held on today’s date.
            </p>

            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" onClick={() => setShowSessionDialog(false)}>
                Cancel
              </Button>
              <Button type="button" onClick={openSessionWithDate}>
                Open session
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showManageModal} onOpenChange={setShowManageModal}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Manage class session</DialogTitle>
          </DialogHeader>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Present</TableHead>
                  <TableHead>Absent</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Delete</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessionLabels.map((session) => {
                  const counts = countsForSession(session);
                  const isDeleteConfirming = deleteConfirmId === session._id;
                  return (
                    <TableRow key={session._id}>
                      <TableCell>{session.label}</TableCell>
                      <TableCell>{counts.present}</TableCell>
                      <TableCell>{counts.absent}</TableCell>
                      <TableCell>
                        <Badge variant={session.open ? 'default' : 'secondary'}>{session.open ? 'Open' : 'Closed'}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant={isDeleteConfirming ? 'destructive' : 'outline'}
                          size="sm"
                          onClick={() => {
                            if (isDeleteConfirming) {
                              deleteSession(session._id);
                            } else {
                              setDeleteConfirmId(session._id);
                            }
                          }}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          {isDeleteConfirming ? 'Confirm delete' : 'Delete'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
