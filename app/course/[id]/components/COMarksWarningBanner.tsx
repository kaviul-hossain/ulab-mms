'use client';

import { AlertTriangle, ArrowRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ExamRef {
  _id: string;
  displayName: string;
}

interface COMarksWarningBannerProps {
  examsWithMissingCO: ExamRef[];
  onGoToCoPo: () => void;
  onIgnore: () => void;
}

export default function COMarksWarningBanner({
  examsWithMissingCO,
  onGoToCoPo,
  onIgnore,
}: COMarksWarningBannerProps) {
  if (examsWithMissingCO.length === 0) return null;

  return (
    <div className="relative rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 mb-6 animate-in slide-in-from-top-2 duration-300">
      {/* Dismiss button */}
      <button
        onClick={onIgnore}
        className="absolute top-3 right-3 text-amber-400/60 hover:text-amber-300 transition-colors"
        title="Ignore for this session"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="flex items-start gap-3 pr-6">
        <div className="mt-0.5 flex-shrink-0">
          <AlertTriangle className="w-5 h-5 text-amber-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-amber-300 mb-1">
            CO Total Marks Not Configured
          </p>
          <p className="text-sm text-amber-200/80 mb-2 leading-relaxed">
            The following exam{examsWithMissingCO.length > 1 ? 's have' : ' has'} Course Outcomes (COs) enabled but
            no CO maximum marks are set in <strong>CO-PO Mapping</strong>. This may cause{' '}
            <strong>overflow issues</strong> in the final Course File output.
          </p>

          {/* Exam chips */}
          <div className="flex flex-wrap gap-2 mb-3">
            {examsWithMissingCO.map((exam) => (
              <span
                key={exam._id}
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/20 text-amber-300 border border-amber-500/30"
              >
                {exam.displayName}
              </span>
            ))}
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              onClick={onGoToCoPo}
              className="gap-1.5 bg-amber-500 hover:bg-amber-400 text-amber-950 font-semibold h-8 text-xs"
            >
              <ArrowRight className="w-3.5 h-3.5" />
              Set CO Marks in CO-PO Mapping
            </Button>
            <button
              onClick={onIgnore}
              className="text-xs text-amber-400/70 hover:text-amber-300 underline underline-offset-2 transition-colors"
            >
              Ignore for this session
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
