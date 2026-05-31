'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, QrCode, RefreshCw, Trash2, Copy, Check, Users, ExternalLink, Save } from 'lucide-react';
import { toast } from 'sonner';
import { RUBRIC_CRITERIA, calculateProjectMark } from '@/app/utils/projectRubric';
import type { IRubricScores } from '@/app/utils/projectRubric';

// ─── Types ───────────────────────────────────────────────────────────────────

interface StudentInfo {
  _id: string;
  name: string;
  studentId: string;
  withdrawn?: boolean;
}

interface GroupEntry {
  _id: string;
  groupNumber: number;
  projectTitle: string;
  studentIds: StudentInfo[];
  examRubricScores: { examId: string; scores: IRubricScores; markMode: 'rubric' | 'direct'; reasoning?: string }[];
  markedAt?: string | null;
}

interface ProjectState {
  courseId?: string;
  isActive: boolean;
  maxMembersPerGroup: number;
  groups: GroupEntry[];
}

interface ProjectExam {
  _id: string;
  displayName: string;
  totalMarks: number;
  examCategory?: string;
  examType?: string;
}

interface ProjectViewProps {
  courseId: string;
  students: StudentInfo[];
  exams: ProjectExam[];
  examFilter?: (e: ProjectExam) => boolean;
  title?: string;
  description?: string;
}

// null means "not yet selected" — different from 0 which means deliberately scored 0
type RubricDraft = { c1: number | null; c2: number | null; c3: number | null; c4: number | null; c5: number | null };
const EMPTY_RUBRIC: IRubricScores = { c1: 0, c2: 0, c3: 0, c4: 0, c5: 0 };
const EMPTY_DRAFT: RubricDraft = { c1: null, c2: null, c3: null, c4: null, c5: null };

// Convert draft (may have nulls) to saveable IRubricScores (nulls → 0)
function draftToScores(d: RubricDraft): IRubricScores {
  return { c1: d.c1 ?? 0, c2: d.c2 ?? 0, c3: d.c3 ?? 0, c4: d.c4 ?? 0, c5: d.c5 ?? 0 };
}

function buildProjectUrl(courseId: string) {
  if (typeof window === 'undefined') return `/project/${courseId}`;
  return `${window.location.origin}/project/${courseId}`;
}

// Given rubric scores for one exam, return { scores, markMode } or undefined
function getExamRubric(group: GroupEntry, examId: string) {
  return group.examRubricScores?.find(e => e.examId?.toString() === examId?.toString());
}


// ─── Detailed rubric inline display ──────────────────────────────────────────
function RubricDetail({ scores }: { scores: IRubricScores }) {
  const shortLabels: Record<string, string> = {
    c1: 'Understanding',
    c2: 'Design',
    c3: 'Result',
    c4: 'Complex Prob.',
    c5: 'Complex Act.',
  };

  return (
    <div className="flex flex-wrap gap-x-6 gap-y-2">
      {RUBRIC_CRITERIA.map(c => {
        const v = scores[c.key] ?? 0;
        const barColor =
          v === 3 ? 'bg-green-500'
          : v === 2 ? 'bg-blue-500'
          : v === 1 ? 'bg-amber-500'
          : 'bg-muted-foreground/30';
        const textColor =
          v === 3 ? 'text-green-700 dark:text-green-300'
          : v === 2 ? 'text-blue-700 dark:text-blue-300'
          : v === 1 ? 'text-amber-700 dark:text-amber-300'
          : 'text-muted-foreground';
        return (
          <div key={c.key} className="flex items-center gap-1.5" title={c.label}>
            <span className="text-xs font-medium text-muted-foreground flex items-center">
              {c.key.toUpperCase()}
              <span className="hidden sm:inline-block ml-1 opacity-70 font-normal">({shortLabels[c.key]})</span>
            </span>
            <div className="flex gap-0.5 items-center mx-1">
              {[0, 1, 2, 3].map(pip => (
                <div
                  key={pip}
                  className={`w-3 h-2.5 rounded-sm transition-colors ${
                    pip <= v ? barColor : 'bg-muted/50 border border-border'
                  }`}
                />
              ))}
            </div>
            <span className={`text-xs font-bold ${textColor}`}>{v}/3</span>
          </div>
        );
      })}
    </div>
  );
}



// ─── Main component ───────────────────────────────────────────────────────────
export default function ProjectView({ courseId, students, exams, examFilter, title, description }: ProjectViewProps) {
  const [state, setState] = useState<ProjectState>({ isActive: false, maxMembersPerGroup: 4, groups: [] });
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [copied, setCopied] = useState(false);
  const [maxInput, setMaxInput] = useState('4');
  const [showStartDialog, setShowStartDialog] = useState(false);

  // Per-group title editing
  const [editingTitle, setEditingTitle] = useState<string | null>(null);
  const [titleDraft, setTitleDraft] = useState('');

  // Group delete
  const [deletingGroupId, setDeletingGroupId] = useState<string | null>(null);

  // Which rubric dialog is open: { groupId, examId } | null
  const [editingRubric, setEditingRubric] = useState<{ groupId: string; examId: string } | null>(null);
  // Draft rubric being edited in the dialog (null = not selected by user yet)
  const [rubricDraft, setRubricDraft] = useState<RubricDraft>(EMPTY_DRAFT);
  const [reasoningDraft, setReasoningDraft] = useState<string>('');

  // Saving state per group
  const [savingMarks, setSavingMarks] = useState<Record<string, boolean>>({});

  // Saved marks (from Mark records): { [groupId]: { [examId]: number } }
  const [savedMarks, setSavedMarks] = useState<Record<string, Record<string, number>>>({});

  const projectExams = examFilter ? exams.filter(examFilter) : exams.filter(e => e.examCategory === 'Project');

  // ─── Data fetching ──────────────────────────────────────────────────────────

  const fetchState = useCallback(async () => {
    try {
      const res = await fetch(`/api/courses/${courseId}/project`);
      const data = await res.json();
      if (res.ok) {
        setState(data);
        setMaxInput(String(data.maxMembersPerGroup ?? 4));
      }
    } catch {
      toast.error('Failed to load project data');
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  const fetchSavedMarks = useCallback(async () => {
    try {
      const res = await fetch(`/api/courses/${courseId}/project/group-marks`);
      if (res.ok) {
        const data = await res.json();
        setSavedMarks(data.marks || {});
      }
    } catch { /* silent */ }
  }, [courseId]);

  useEffect(() => { fetchState(); fetchSavedMarks(); }, [fetchState, fetchSavedMarks]);

  // Auto-refresh when active
  useEffect(() => {
    if (!state.isActive) return;
    const interval = setInterval(fetchState, 15000);
    return () => clearInterval(interval);
  }, [state.isActive, fetchState]);

  // ─── Session toggle ─────────────────────────────────────────────────────────

  const handleToggle = async () => {
    if (!state.isActive) { setShowStartDialog(true); return; }
    setToggling(true);
    try {
      const res = await fetch(`/api/courses/${courseId}/project`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) { setState(data); toast.success('Project session closed'); }
      else toast.error(data.error || 'Failed to toggle session');
    } finally { setToggling(false); }
  };

  const handleStart = async () => {
    setToggling(true);
    setShowStartDialog(false);
    try {
      const res = await fetch(`/api/courses/${courseId}/project`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ maxMembersPerGroup: parseInt(maxInput) || 4 }),
      });
      const data = await res.json();
      if (res.ok) { setState(data); toast.success('Project session started!'); }
      else toast.error(data.error || 'Failed to start session');
    } finally { setToggling(false); }
  };

  // ─── Group actions ──────────────────────────────────────────────────────────

  const handleDeleteGroup = async (groupId: string) => {
    if (deletingGroupId !== groupId) { setDeletingGroupId(groupId); return; }
    try {
      const res = await fetch(`/api/courses/${courseId}/project/groups`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groupId }),
      });
      const data = await res.json();
      if (res.ok) { setState(data); toast.success('Group removed'); setDeletingGroupId(null); }
      else toast.error(data.error || 'Failed to delete group');
    } catch { toast.error('Network error'); }
  };

  const handleSaveTitle = async (groupId: string) => {
    try {
      const res = await fetch(`/api/courses/${courseId}/project`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groupId, projectTitle: titleDraft }),
      });
      const data = await res.json();
      if (res.ok) { setState(data); setEditingTitle(null); toast.success('Title updated'); }
      else toast.error(data.error || 'Failed to update title');
    } catch { toast.error('Network error'); }
  };

  // ─── Rubric + mode persistence ──────────────────────────────────────────────

  /** Persist rubric scores for a specific group+exam.
   *  Returns the updated ProjectState from the server so we can drive state from DB. */
  const persistExamRubric = useCallback(async (
    groupId: string,
    examId: string,
    scores: IRubricScores,
    reasoning: string
  ): Promise<ProjectState | null> => {
    try {
      const res = await fetch(`/api/courses/${courseId}/project`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groupId, examRubricScores: { examId, scores, markMode: 'rubric', reasoning } }),
      });
      if (res.ok) return await res.json();
    } catch { /* fall through */ }
    return null;
  }, [courseId]);

  /** Open rubric dialog — seed draft from saved scores (null for unset 0s) */
  const handleOpenRubric = (group: GroupEntry, examId: string) => {
    const entry = getExamRubric(group, examId);
    const saved = entry?.scores;
    // If all saved scores are 0 AND entry doesn't exist yet → treat as unset (null)
    const hasBeenScored = saved && (saved.c1 > 0 || saved.c2 > 0 || saved.c3 > 0 || saved.c4 > 0 || saved.c5 > 0);
    setRubricDraft(
      hasBeenScored
        ? { c1: saved!.c1, c2: saved!.c2, c3: saved!.c3, c4: saved!.c4, c5: saved!.c5 }
        : EMPTY_DRAFT
    );
    setReasoningDraft(entry?.reasoning || '');
    setEditingRubric({ groupId: group._id, examId });
  };

  /** Save rubric dialog → persist scores → update state from server response */
  const handleSaveRubric = async () => {
    if (!editingRubric) return;
    const { groupId, examId } = editingRubric;
    const scores = draftToScores(rubricDraft);
    const reasoning = reasoningDraft;

    setEditingRubric(null); // close dialog immediately

    // Persist to DB and drive state from the response (no stale optimistic data)
    const updated = await persistExamRubric(groupId, examId, scores, reasoning);
    if (updated) {
      setState(updated);
      toast.success('Rubric scores saved');
      
      const group = updated.groups.find(g => g._id === groupId);
      if (group) {
        handleSaveGroupMarks(group);
      }
    } else {
      toast.error('Failed to save rubric — please try again');
    }
  };

  // ─── Save marks ─────────────────────────────────────────────────────────────

  const handleSaveGroupMarks = async (group: GroupEntry) => {
    if (group.studentIds.length === 0) { toast.error('No students in this group'); return; }
    setSavingMarks(prev => ({ ...prev, [group._id]: true }));
    try {
      const entries: { examId: string; rawMark: number }[] = [];

      for (const exam of projectExams) {
        const entry = getExamRubric(group, exam._id);
        const scores = entry?.scores ?? EMPTY_RUBRIC;
        const total = (scores.c1 ?? 0) + (scores.c2 ?? 0) + (scores.c3 ?? 0) + (scores.c4 ?? 0) + (scores.c5 ?? 0);
        if (total === 0) continue; // skip unscored
        const computed = calculateProjectMark(scores, exam.totalMarks);
        entries.push({ examId: exam._id, rawMark: computed });
      }

      if (entries.length === 0) {
        toast.error('No marks to save — score at least one exam first');
        setSavingMarks(prev => ({ ...prev, [group._id]: false }));
        return;
      }

      const res = await fetch(`/api/courses/${courseId}/project/group-marks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          groupId: group._id,
          studentIds: group.studentIds.map(s => s._id),
          marks: entries,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Marks saved for Group ${group.groupNumber}`);
        setSavedMarks(prev => {
          const next = { ...prev, [group._id]: { ...prev[group._id] } };
          for (const e of entries) next[group._id][e.examId] = e.rawMark;
          return next;
        });
      } else {
        toast.error(data.error || 'Failed to save marks');
      }
    } catch { toast.error('Network error'); }
    finally { setSavingMarks(prev => ({ ...prev, [group._id]: false })); }
  };

  // ─── Misc ───────────────────────────────────────────────────────────────────

  const handleUpdateMaxMembers = async () => {
    const val = parseInt(maxInput);
    if (!val || val < 1) { toast.error('Enter a valid number'); return; }
    try {
      const res = await fetch(`/api/courses/${courseId}/project`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ maxMembersPerGroup: val }),
      });
      const data = await res.json();
      if (res.ok) { setState(data); toast.success('Max members updated'); }
      else toast.error(data.error || 'Failed to update');
    } catch { toast.error('Network error'); }
  };

  const handleCopyUrl = async () => {
    await navigator.clipboard.writeText(buildProjectUrl(courseId));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const projectUrl = buildProjectUrl(courseId);
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=420x420&data=${encodeURIComponent(projectUrl)}`;
  const assignedIds = new Set(state.groups.flatMap(g => g.studentIds.map(s => s._id)));
  const unassignedStudents = students.filter(s => !s.withdrawn && !assignedIds.has(s._id));

  const activeRubricExam = editingRubric ? projectExams.find(e => e._id === editingRubric.examId) : null;
  const activeRubricGroup = editingRubric ? state.groups.find(g => g._id === editingRubric.groupId) : null;

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold">{title || 'Project Groups'}</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {description || 'Score each group\'s project using the rubric. Marks are automatically calculated and pushed to the Marks tab.'}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={() => { fetchState(); fetchSavedMarks(); }} disabled={loading}>
            <RefreshCw className="w-4 h-4 mr-2" />Refresh
          </Button>
          {state.isActive && (
            <>
              <Button variant="outline" size="sm" onClick={() => setShowQr(true)}>
                <QrCode className="w-4 h-4 mr-2" />QR Code
              </Button>
              <Button variant="outline" size="sm" onClick={() => window.open(projectUrl, '_blank')}>
                <ExternalLink className="w-4 h-4 mr-2" />Open URL
              </Button>
            </>
          )}
          <Button
            onClick={handleToggle}
            disabled={toggling}
            className={state.isActive ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-slate-600 hover:bg-slate-700 text-white'}
          >
            {toggling
              ? <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              : <span className={`w-2 h-2 rounded-full mr-2 ${state.isActive ? 'bg-green-300 animate-pulse' : 'bg-slate-400'}`} />}
            {state.isActive ? 'Close Project Session' : 'Start Project Work'}
          </Button>
        </div>
      </div>

      {/* ── Active session banner ── */}
      {state.isActive && (
        <div className="rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex-1">
            <p className="text-sm font-medium text-green-700 dark:text-green-300">Session is active — students can register</p>
            <p className="text-xs text-green-600/80 dark:text-green-400/80 mt-0.5 break-all">{projectUrl}</p>
          </div>
          <Button size="sm" variant="outline" onClick={handleCopyUrl} className="border-green-500/40 text-green-700 dark:text-green-300 shrink-0">
            {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
            {copied ? 'Copied!' : 'Copy URL'}
          </Button>
        </div>
      )}

      {/* ── Settings row ── */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-muted-foreground">Max members per group:</label>
          <input type="number" min={1} max={20} value={maxInput} onChange={e => setMaxInput(e.target.value)}
            className="w-16 h-8 rounded-md border bg-background px-2 text-sm text-center" />
          <Button size="sm" variant="outline" onClick={handleUpdateMaxMembers}>Update</Button>
        </div>
        <div className="ml-auto flex gap-2">
          <Button size="sm" variant="outline" onClick={() => window.open(`/api/courses/${courseId}/project/export-pdf-simple`, '_blank')}
            className="border-emerald-500/40 hover:bg-emerald-500/10">
            🖨️ Print Simple Grid
          </Button>
          <Button size="sm" variant="outline" onClick={() => window.open(`/api/courses/${courseId}/project/export-pdf-blank`, '_blank')}
            className="border-indigo-500/40 hover:bg-indigo-500/10">
            🖨️ Print Blank Rubrics
          </Button>
          <Button size="sm" variant="outline" onClick={() => window.open(`/api/courses/${courseId}/project/export-pdf`, '_blank')}
            className="border-blue-500/40 hover:bg-blue-500/10">
            📄 Export PDF
          </Button>
        </div>
      </div>

      {/* ── No project exams warning ── */}
      {projectExams.length === 0 && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-4 text-sm text-amber-700 dark:text-amber-400">
          ⚠️ No Project exams found. Go to the <strong>Exams</strong> tab and add exams with the <strong>Project</strong> category to enable marking here.
        </div>
      )}

      {/* ── Groups list ── */}
      {state.groups.length === 0 ? (
        <div className="rounded-xl border border-dashed p-12 text-center">
          <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground/40" />
          <p className="text-muted-foreground font-medium">No groups yet</p>
          <p className="text-sm text-muted-foreground/60 mt-1">
            Start the session and share the QR code or URL — students will create and join groups themselves.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {state.groups.map(group => {
            const groupSaved = savedMarks[group._id] ?? {};
            const allSaved = projectExams.length > 0 && projectExams.every(e => groupSaved[e._id] !== undefined);

            return (
              <div key={group._id} className="rounded-xl border bg-card shadow-sm overflow-hidden">

                {/* ─ Group header bar ─ */}
                <div className="flex items-center gap-3 px-5 py-4 border-b bg-muted/30">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center font-bold text-primary">
                    {group.groupNumber}
                  </div>
                  <div className="flex-1 min-w-0">
                    {editingTitle === group._id ? (
                      <div className="flex items-center gap-2">
                        <input autoFocus type="text" value={titleDraft}
                          onChange={e => setTitleDraft(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && handleSaveTitle(group._id)}
                          className="rounded-md border bg-background px-3 py-1 text-sm w-64" placeholder="Enter project title..." />
                        <Button size="sm" onClick={() => handleSaveTitle(group._id)}>Save</Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditingTitle(null)}>✕</Button>
                      </div>
                    ) : (
                      <button onClick={() => { setEditingTitle(group._id); setTitleDraft(group.projectTitle || ''); }}
                        className="text-left hover:opacity-70 transition-opacity w-full">
                        <span className="font-semibold truncate block">
                          {group.projectTitle || <span className="text-muted-foreground/50 italic font-normal text-sm">Click to add title...</span>}
                        </span>
                      </button>
                    )}
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-muted-foreground">{group.studentIds.length}/{state.maxMembersPerGroup} members</span>
                      {allSaved && <Badge className="text-xs bg-green-500/20 text-green-700 dark:text-green-300 border-green-500/30">✓ All saved</Badge>}
                    </div>
                  </div>
                  <Button size="sm" variant={deletingGroupId === group._id ? 'destructive' : 'ghost'}
                    onClick={() => handleDeleteGroup(group._id)}>
                    <Trash2 className="w-4 h-4" />
                    {deletingGroupId === group._id ? <span className="ml-1 text-xs">Confirm</span> : null}
                  </Button>
                </div>

                {/* ─ Members ─ */}
                <div className="px-5 py-3 flex flex-wrap gap-2 border-b bg-background">
                  {group.studentIds.length === 0 ? (
                    <span className="text-sm text-muted-foreground/50 italic">No members yet</span>
                  ) : group.studentIds.map(s => (
                    <span key={s._id} className="inline-flex items-center gap-1.5 bg-muted/60 rounded-full px-3 py-1 text-sm">
                      <span className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary">{s.name.charAt(0)}</span>
                      {s.name} <span className="text-muted-foreground text-xs">({s.studentId})</span>
                    </span>
                  ))}
                </div>

                {/* ─ Per-exam mark rows ─ */}
                {projectExams.length > 0 && (
                  <div className="px-5 py-4 space-y-3">
                    <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">Project Marks</p>

                    {projectExams.map(exam => {
                      const entry = getExamRubric(group, exam._id);
                      const scores = entry?.scores ?? EMPTY_RUBRIC;
                      const computed = calculateProjectMark(scores, exam.totalMarks);
                      const savedMark = groupSaved[exam._id];

                      return (
                        <div key={exam._id} className="rounded-lg border bg-muted/10 overflow-hidden">
                          {/* Exam header */}
                          <div className="flex items-center justify-between gap-3 px-4 py-2.5 border-b bg-muted/20">
                            <div>
                              <span className="text-sm font-semibold">{exam.displayName}</span>
                              <span className="text-xs text-muted-foreground ml-2">out of {exam.totalMarks}</span>
                              {savedMark !== undefined && (
                                <span className="ml-2 text-xs font-medium text-green-600 dark:text-green-400">
                                  · saved: {savedMark} pts
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Rubric content */}
                          <div className="px-4 py-3">
                            <div className="space-y-3">
                              {!entry ? (
                                <p className="text-sm text-muted-foreground italic">No rubric scored yet — click to score</p>
                              ) : (
                                <div className="space-y-2">
                                  <RubricDetail scores={scores} />
                                  {entry.reasoning && (
                                    <p className="text-xs text-muted-foreground italic mt-2 border-l-2 pl-2 border-primary/20">
                                      "{entry.reasoning}"
                                    </p>
                                  )}
                                  <p className="text-sm pt-1">
                                    Total: <strong>{(scores.c1 ?? 0) + (scores.c2 ?? 0) + (scores.c3 ?? 0) + (scores.c4 ?? 0) + (scores.c5 ?? 0)}/15</strong>
                                    <span className="mx-1 text-muted-foreground">→</span>
                                    <strong className="text-foreground">{computed} / {exam.totalMarks} marks</strong>
                                  </p>
                                </div>
                              )}
                              <Button size="sm" variant="outline" onClick={() => handleOpenRubric(group, exam._id)} className="shrink-0">
                                📊 {!entry ? 'Score Rubric' : 'Edit Rubric'}
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Unassigned students ── */}
      {unassignedStudents.length > 0 && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-5">
          <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
            ⏳ Unassigned Students <Badge variant="secondary">{unassignedStudents.length}</Badge>
          </h3>
          <div className="flex flex-wrap gap-2">
            {unassignedStudents.map(s => (
              <span key={s._id} className="inline-flex items-center gap-1.5 bg-muted/60 rounded-full px-3 py-1 text-sm">
                {s.name} <span className="text-muted-foreground text-xs">({s.studentId})</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {unassignedStudents.length === 0 && state.groups.length > 0 && (
        <div className="rounded-xl border border-green-500/30 bg-green-500/5 px-4 py-3 text-sm text-green-700 dark:text-green-400 flex items-center gap-2">
          🎉 All students are assigned to groups!
        </div>
      )}

      {/* ─── Rubric dialog ─── */}
      <Dialog open={editingRubric !== null} onOpenChange={open => !open && setEditingRubric(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 flex-wrap">
              Rubric Scoring — Group {activeRubricGroup?.groupNumber}
              {activeRubricExam && (
                <span className="text-sm font-normal text-muted-foreground">
                  · {activeRubricExam.displayName} (out of {activeRubricExam.totalMarks})
                </span>
              )}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {RUBRIC_CRITERIA.map(criterion => (
              <div key={criterion.key} className="rounded-xl border p-4 space-y-3">
                <div>
                  <p className="font-semibold text-sm">{criterion.label}</p>
                  <p className="text-xs text-muted-foreground">{criterion.co}</p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {([0, 1, 2, 3] as const).map(score => (
                    <button
                      key={score}
                      onClick={() => setRubricDraft(prev => ({ ...prev, [criterion.key]: score }))}
                      className={`rounded-lg border p-2.5 text-left transition-all ${
                        rubricDraft[criterion.key] === score
                          ? score === 3 ? 'border-green-500 bg-green-500/20 text-green-700 dark:text-green-300'
                            : score === 2 ? 'border-blue-500 bg-blue-500/20 text-blue-700 dark:text-blue-300'
                            : score === 1 ? 'border-amber-500 bg-amber-500/20 text-amber-700 dark:text-amber-300'
                            : 'border-red-500 bg-red-500/20 text-red-700 dark:text-red-300'
                          : 'border-border hover:border-muted-foreground/50 hover:bg-muted/30'
                      }`}
                    >
                      <div className="font-bold text-lg">{score}</div>
                      <div className="text-[10px] mt-1 leading-tight opacity-80">{criterion.descriptions[score]}</div>
                    </button>
                  ))}
                </div>
              </div>
            ))}

            {activeRubricExam && (
              <div className="rounded-xl bg-muted/40 border px-4 py-3 flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Calculated mark:</span>
                <span className="font-bold text-lg">
                  {calculateProjectMark(draftToScores(rubricDraft), activeRubricExam.totalMarks)} / {activeRubricExam.totalMarks}
                </span>
              </div>
            )}
            
            <div className="space-y-1.5 mt-2">
              <label className="text-sm font-medium">Reasoning / Comments</label>
              <textarea
                value={reasoningDraft}
                onChange={e => setReasoningDraft(e.target.value)}
                placeholder="Briefly explain the marks..."
                className="w-full h-20 rounded-md border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setEditingRubric(null)}>Cancel</Button>
              <Button onClick={handleSaveRubric}>Save Rubric</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ─── QR dialog ─── */}
      <Dialog open={showQr} onOpenChange={setShowQr}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Project Registration QR Code</DialogTitle></DialogHeader>
          <div className="flex flex-col items-center gap-4 py-4">
            <img src={qrImageUrl} alt="Project QR Code" className="rounded-xl border bg-white p-3" />
            <p className="text-xs text-muted-foreground text-center break-all max-w-xs">{projectUrl}</p>
            <Button variant="outline" onClick={handleCopyUrl} className="w-full">
              {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
              {copied ? 'Copied!' : 'Copy URL'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ─── Start session dialog ─── */}
      <Dialog open={showStartDialog} onOpenChange={setShowStartDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Start Project Session</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium">Maximum members per group</label>
              <p className="text-xs text-muted-foreground mt-0.5">Students won&apos;t be able to join a full group.</p>
              <input type="number" min={1} max={20} value={maxInput} onChange={e => setMaxInput(e.target.value)}
                className="mt-2 w-full rounded-md border bg-background px-3 py-2 text-sm" />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowStartDialog(false)}>Cancel</Button>
              <Button onClick={handleStart} disabled={toggling}>
                {toggling ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Start Session
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
