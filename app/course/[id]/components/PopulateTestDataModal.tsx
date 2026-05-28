'use client';

import { useEffect, useRef, useState } from 'react';
import { FlaskConical, AlertTriangle, CheckCircle2, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

type Phase = 'confirm' | 'running' | 'done' | 'error';

interface PopulateStep {
  label: string;
  detail: string;
}

const STEPS: PopulateStep[] = [
  { label: 'Preparing', detail: 'Connecting to database…' },
  { label: 'Clearing data', detail: 'Removing existing students and marks…' },
  { label: 'Generating students', detail: 'Creating 30–40 random mock students…' },
  { label: 'Generating marks', detail: 'Randomising scores for every exam…' },
  { label: 'Populating attendance', detail: 'Creating attendance sessions and records…' },
  { label: 'Finalising', detail: 'Saving and verifying data…' },
];

// Steps shown when there are no existing students (no delete step)
const STEPS_FRESH: PopulateStep[] = [
  { label: 'Preparing', detail: 'Connecting to database…' },
  { label: 'Generating students', detail: 'Creating 30–40 random mock students…' },
  { label: 'Generating marks', detail: 'Randomising scores for every exam…' },
  { label: 'Populating attendance', detail: 'Creating attendance sessions and records…' },
  { label: 'Finalising', detail: 'Saving and verifying data…' },
];

interface Props {
  isOpen: boolean;
  hasStudents: boolean;
  onClose: () => void;
  onConfirm: () => Promise<{ studentsAdded: number; marksAdded: number } | null>;
}

export default function PopulateTestDataModal({ isOpen, hasStudents, onClose, onConfirm }: Props) {
  const [phase, setPhase] = useState<Phase>('confirm');
  const [stepIndex, setStepIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [resultData, setResultData] = useState<{ studentsAdded: number; marksAdded: number } | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const stepTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const steps = hasStudents ? STEPS : STEPS_FRESH;

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setPhase('confirm');
      setStepIndex(0);
      setProgress(0);
      setResultData(null);
      setErrorMsg('');
    }
    return () => {
      if (stepTimerRef.current) clearInterval(stepTimerRef.current);
    };
  }, [isOpen]);

  const startProgress = () => {
    setPhase('running');
    setStepIndex(0);
    setProgress(0);

    // Animate progress steps over ~4s total
    const totalSteps = steps.length;
    const intervalMs = 3800 / totalSteps;
    let currentStep = 0;

    stepTimerRef.current = setInterval(() => {
      currentStep++;
      if (currentStep >= totalSteps - 1) {
        if (stepTimerRef.current) clearInterval(stepTimerRef.current);
        setStepIndex(totalSteps - 1);
        setProgress(90); // Hold at 90% until API responds
        return;
      }
      setStepIndex(currentStep);
      setProgress(Math.round((currentStep / totalSteps) * 90));
    }, intervalMs);
  };

  const handleConfirm = async () => {
    startProgress();

    try {
      const result = await onConfirm();
      if (stepTimerRef.current) clearInterval(stepTimerRef.current);

      if (result) {
        setProgress(100);
        setStepIndex(steps.length - 1);
        setResultData(result);
        setPhase('done');
      } else {
        setErrorMsg('Server returned an error. Please try again.');
        setPhase('error');
      }
    } catch (e: any) {
      if (stepTimerRef.current) clearInterval(stepTimerRef.current);
      setErrorMsg(e?.message || 'An unexpected error occurred.');
      setPhase('error');
    }
  };

  const handleClose = () => {
    if (stepTimerRef.current) clearInterval(stepTimerRef.current);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center">
      {/* Blurred backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-md"
        onClick={phase === 'confirm' ? handleClose : undefined}
      />

      <div className="relative z-10 w-full max-w-md mx-4 rounded-2xl border border-white/10 bg-gray-900/95 shadow-2xl overflow-hidden">
        {/* Top accent bar */}
        <div className={`h-1 w-full transition-all duration-500 ${
          phase === 'done' ? 'bg-green-500' :
          phase === 'error' ? 'bg-red-500' :
          'bg-gradient-to-r from-blue-500 via-violet-500 to-pink-500'
        }`} />

        <div className="p-6">
          {/* ─── CONFIRM PHASE ─── */}
          {phase === 'confirm' && (
            <>
              <div className="flex items-start gap-4 mb-5">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                  hasStudents ? 'bg-amber-500/20' : 'bg-blue-500/20'
                }`}>
                  {hasStudents
                    ? <RefreshCw className="w-6 h-6 text-amber-400" />
                    : <FlaskConical className="w-6 h-6 text-blue-400" />}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">
                    {hasStudents ? 'Re-populate Test Data' : 'Populate Test Data'}
                  </h2>
                  <p className="text-sm text-gray-400 mt-1">
                    {hasStudents
                      ? 'This will delete all existing students, marks, and attendance data, then generate fresh test data.'
                      : 'This will generate random students, exam marks, and attendance records for testing purposes.'}
                  </p>
                </div>
              </div>

              {hasStudents && (
                <div className="mb-5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 flex items-start gap-3">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <p className="text-sm text-amber-300">
                    <strong>Warning:</strong> All current student data will be permanently erased before new data is created.
                  </p>
                </div>
              )}

              <div className="rounded-xl bg-white/5 border border-white/10 px-4 py-3 mb-6 space-y-2">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">What will be generated</p>
                {steps.filter(s => !s.label.includes('Clear')).map((s, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-gray-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                    {s.label} — <span className="text-gray-500 text-xs">{s.detail}</span>
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={handleClose}>
                  Cancel
                </Button>
                <Button
                  onClick={handleConfirm}
                  className={`flex-1 text-white font-semibold ${
                    hasStudents
                      ? 'bg-amber-600 hover:bg-amber-700'
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {hasStudents ? (
                    <><RefreshCw className="w-4 h-4 mr-2" />Re-populate</>
                  ) : (
                    <><FlaskConical className="w-4 h-4 mr-2" />Generate Data</>
                  )}
                </Button>
              </div>
            </>
          )}

          {/* ─── RUNNING PHASE ─── */}
          {phase === 'running' && (
            <>
              <div className="flex items-center gap-3 mb-6">
                <Loader2 className="w-6 h-6 text-blue-400 animate-spin shrink-0" />
                <div>
                  <h2 className="text-base font-bold text-white">
                    {hasStudents ? 'Re-populating…' : 'Generating test data…'}
                  </h2>
                  <p className="text-xs text-gray-400 mt-0.5">Please wait, do not close this window</p>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mb-5">
                <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                  <span>{steps[stepIndex]?.label}</span>
                  <span>{progress}%</span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-blue-500 via-violet-500 to-pink-500 transition-all duration-700 ease-out"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              {/* Steps list */}
              <div className="space-y-2.5">
                {steps.map((step, i) => {
                  const isDone = i < stepIndex;
                  const isCurrent = i === stepIndex;
                  return (
                    <div
                      key={i}
                      className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all duration-300 ${
                        isCurrent ? 'bg-blue-500/15 border border-blue-500/30' :
                        isDone ? 'opacity-50' : 'opacity-25'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold ${
                        isDone ? 'bg-green-500/30 text-green-300' :
                        isCurrent ? 'bg-blue-500/30 text-blue-300' :
                        'bg-white/10 text-gray-500'
                      }`}>
                        {isDone ? '✓' : i + 1}
                      </div>
                      <div>
                        <div className={`text-sm font-medium ${isCurrent ? 'text-white' : 'text-gray-400'}`}>
                          {step.label}
                        </div>
                        {isCurrent && (
                          <div className="text-xs text-gray-500 mt-0.5">{step.detail}</div>
                        )}
                      </div>
                      {isCurrent && (
                        <Loader2 className="w-3.5 h-3.5 text-blue-400 animate-spin ml-auto shrink-0" />
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* ─── DONE PHASE ─── */}
          {phase === 'done' && resultData && (
            <>
              <div className="text-center py-4">
                <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-9 h-9 text-green-400" />
                </div>
                <h2 className="text-lg font-bold text-white mb-1">Done!</h2>
                <p className="text-sm text-gray-400 mb-6">Test data has been generated successfully.</p>

                <div className="grid grid-cols-2 gap-3 mb-6 text-left">
                  <div className="rounded-xl bg-blue-500/10 border border-blue-500/20 p-4">
                    <div className="text-2xl font-bold text-blue-300">{resultData.studentsAdded}</div>
                    <div className="text-xs text-gray-400 mt-1">Students created</div>
                  </div>
                  <div className="rounded-xl bg-violet-500/10 border border-violet-500/20 p-4">
                    <div className="text-2xl font-bold text-violet-300">{resultData.marksAdded}</div>
                    <div className="text-xs text-gray-400 mt-1">Mark entries added</div>
                  </div>
                </div>

                <Button onClick={handleClose} className="w-full bg-green-600 hover:bg-green-700 text-white">
                  Close
                </Button>
              </div>
            </>
          )}

          {/* ─── ERROR PHASE ─── */}
          {phase === 'error' && (
            <>
              <div className="text-center py-4">
                <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle className="w-9 h-9 text-red-400" />
                </div>
                <h2 className="text-lg font-bold text-white mb-1">Something went wrong</h2>
                <p className="text-sm text-gray-500 mb-2">{errorMsg}</p>
                <Button onClick={handleClose} variant="outline" className="w-full mt-4">
                  Close
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
