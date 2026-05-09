"use client";

import { useEffect, useState } from 'react';
import { signIn, useSession } from 'next-auth/react';

export default function AttendanceCheckInPage({ params }: { params: { sessionCode: string } }) {
  const { data: session } = useSession();
  const courseId = params.sessionCode;
  const [status, setStatus] = useState<string>('Preparing check-in...');

  useEffect(() => {
    if (!session) return;

    const markAttendance = async () => {
      setStatus('Recording attendance...');
      try {
        const res = await fetch('/api/attendance/checkin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ courseId }),
        });
        const data = await res.json();
        if (res.ok) {
          setStatus(data.message || 'Attendance recorded');
        } else {
          setStatus(data.error || 'Unable to record attendance');
        }
      } catch (err) {
        setStatus('Network error');
      }
    };

    markAttendance();
  }, [session, courseId]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-lg rounded-2xl border bg-background p-6 shadow-lg">
        <h1 className="text-2xl font-semibold">Attendance Check-in</h1>
        <p className="mt-2 text-sm text-muted-foreground">Sign in with your ULAB Google account to mark attendance.</p>

        {!session ? (
          <button
            className="mt-6 inline-flex items-center justify-center rounded-lg bg-green-600 px-4 py-2 font-medium text-white hover:bg-green-700"
            onClick={() => signIn('google', { callbackUrl: window.location.href })}
          >
            Sign in with Google
          </button>
        ) : (
          <div className="mt-6 space-y-2 text-sm">
            <p>Signed in as {session.user?.email}</p>
            <p className="font-medium">{status}</p>
          </div>
        )}
      </div>
    </div>
  );
}
