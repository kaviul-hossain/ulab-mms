'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, QrCode, RefreshCw, Trash2, Copy, Check, Users, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { RUBRIC_CRITERIA, calculateProjectMark } from '@/app/utils/projectRubric';
import type { IRubricScores } from '@/app/utils/projectRubric';

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
  rubricScores: IRubricScores;
  markedAt?: string | null;
}

interface ProjectState {
  courseId?: string;
  isActive: boolean;
  maxMembersPerGroup: number;
  groups: GroupEntry[];
}

interface ProjectViewProps {
  courseId: string;
  students: StudentInfo[];
  exams: { _id: string; displayName: string; totalMarks: number; examCategory?: string }[];
}

const SCORE_LABELS = ['0 — No/Wrong', '1 — Poor', '2 — Developing', '3 — Accomplished'];

function buildProjectUrl(courseId: string) {
  if (typeof window === 'undefined') return `/project/${courseId}`;
  return `${window.location.origin}/project/${courseId}`;
}

export default function ProjectView({ courseId, students, exams }: ProjectViewProps) {
  const [state, setState] = useState<ProjectState>({ isActive: false, maxMembersPerGroup: 4, groups: [] });
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [copied, setCopied] = useState(false);
  const [maxInput, setMaxInput] = useState('4');
  const [showStartDialog, setShowStartDialog] = useState(false);

  // Per-group rubric editing state
  const [editingRubric, setEditingRubric] = useState<string | null>(null); // groupId
  const [rubricDraft, setRubricDraft] = useState<IRubricScores>({ c1: 0, c2: 0, c3: 0, c4: 0, c5: 0 });
  const [savingRubric, setSavingRubric] = useState(false);

  // Per-group title editing
  const [editingTitle, setEditingTitle] = useState<string | null>(null);
  const [titleDraft, setTitleDraft] = useState('');

  // Group delete (instructor can still clean up)
  const [deletingGroupId, setDeletingGroupId] = useState<string | null>(null);

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

  useEffect(() => { fetchState(); }, [fetchState]);

  // Auto-refresh when active
  useEffect(() => {
    if (!state.isActive) return;
    const interval = setInterval(fetchState, 15000);
    return () => clearInterval(interval);
  }, [state.isActive, fetchState]);

  const handleToggle = async () => {
    if (!state.isActive) {
      // Show dialog to configure max members before starting
      setShowStartDialog(true);
      return;
    }
    // Stop session
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
      if (res.ok) { setState(data); toast.success('Project session started! Students can now register.'); }
      else toast.error(data.error || 'Failed to start session');
    } finally { setToggling(false); }
  };

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

  const handleSaveRubric = async (groupId: string) => {
    setSavingRubric(true);
    try {
      const res = await fetch(`/api/courses/${courseId}/project`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groupId, rubricScores: rubricDraft }),
      });
      const data = await res.json();
      if (res.ok) { setState(data); setEditingRubric(null); toast.success('Rubric scores saved'); }
      else toast.error(data.error || 'Failed to save rubric');
    } finally { setSavingRubric(false); }
  };

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
    const url = buildProjectUrl(courseId);
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportPdf = () => {
    // Opens the printable HTML page in a new tab — use Ctrl+P / Cmd+P to print as PDF
    window.open(`/api/courses/${courseId}/project/export-pdf`, '_blank');
  };

  const projectUrl = buildProjectUrl(courseId);
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=420x420&data=${encodeURIComponent(projectUrl)}`;

  const assignedStudentIds = new Set(state.groups.flatMap(g => g.studentIds.map(s => s._id)));
  const unassignedStudents = students.filter(s => !s.withdrawn && !assignedStudentIds.has(s._id));

  const projectExam = exams.find(e => e.examCategory === 'Project');

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold">Project Groups</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage student project groups, assign rubric scores, and push marks to the Marks tab.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={fetchState} disabled={loading}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          {state.isActive && (
            <>
              <Button variant="outline" size="sm" onClick={() => setShowQr(true)}>
                <QrCode className="w-4 h-4 mr-2" />
                QR Code
              </Button>
              <Button variant="outline" size="sm" onClick={() => window.open(projectUrl, '_blank')}>
                <ExternalLink className="w-4 h-4 mr-2" />
                Open URL
              </Button>
            </>
          )}
          <Button
            onClick={handleToggle}
            disabled={toggling}
            className={state.isActive ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-slate-600 hover:bg-slate-700 text-white'}
          >
            {toggling ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <span className={`w-2 h-2 rounded-full mr-2 ${state.isActive ? 'bg-green-300 animate-pulse' : 'bg-slate-400'}`} />}
            {state.isActive ? 'Close Project Session' : 'Start Project Work'}
          </Button>
        </div>
      </div>

      {/* Status bar */}
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

      {/* Settings + actions row */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-muted-foreground">Max members per group:</label>
          <input
            type="number"
            min={1}
            max={20}
            value={maxInput}
            onChange={e => setMaxInput(e.target.value)}
            className="w-16 h-8 rounded-md border bg-background px-2 text-sm text-center"
          />
          <Button size="sm" variant="outline" onClick={handleUpdateMaxMembers}>Update</Button>
        </div>
        <div className="ml-auto">
          <Button
            size="sm"
            variant="outline"
            onClick={handleExportPdf}
            className="border-blue-500/40 hover:bg-blue-500/10"
          >
            📄 Export PDF
          </Button>
        </div>
      </div>

      {/* Groups table */}
      {state.groups.length === 0 ? (
        <div className="rounded-xl border border-dashed p-12 text-center">
          <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground/40" />
          <p className="text-muted-foreground font-medium">No groups yet</p>
          <p className="text-sm text-muted-foreground/60 mt-1">
            Start the session and share the QR code or URL — students will create and join groups themselves.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {state.groups.map(group => {
            const projectExamForMark = projectExam;
            const computedMark = projectExamForMark
              ? calculateProjectMark(group.rubricScores, projectExamForMark.totalMarks)
              : null;
            const totalRubricScore = group.rubricScores.c1 + group.rubricScores.c2 + group.rubricScores.c3 + group.rubricScores.c4 + group.rubricScores.c5;
            const isMarked = group.markedAt != null && totalRubricScore > 0;

            return (
              <div key={group._id} className="rounded-xl border bg-card p-5 space-y-4">
                {/* Group header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center font-bold text-primary text-lg">
                      {group.groupNumber}
                    </div>
                    <div>
                      {editingTitle === group._id ? (
                        <div className="flex items-center gap-2">
                          <input
                            autoFocus
                            type="text"
                            value={titleDraft}
                            onChange={e => setTitleDraft(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleSaveTitle(group._id)}
                            className="rounded-md border bg-background px-3 py-1 text-sm w-64"
                            placeholder="Enter project title..."
                          />
                          <Button size="sm" onClick={() => handleSaveTitle(group._id)}>Save</Button>
                          <Button size="sm" variant="ghost" onClick={() => setEditingTitle(null)}>✕</Button>
                        </div>
                      ) : (
                        <button
                          onClick={() => { setEditingTitle(group._id); setTitleDraft(group.projectTitle || ''); }}
                          className="text-left hover:opacity-70 transition-opacity"
                        >
                          <span className="font-semibold">
                            {group.projectTitle || <span className="text-muted-foreground/50 italic font-normal text-sm">Click to add title...</span>}
                          </span>
                        </button>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-xs">
                          {group.studentIds.length}/{state.maxMembersPerGroup} members
                        </Badge>
                        {isMarked && (
                          <Badge className="text-xs bg-green-500/20 text-green-700 dark:text-green-300 border-green-500/30">
                            ✓ Marked
                          </Badge>
                        )}
                        {computedMark !== null && (
                          <Badge variant="outline" className="text-xs font-bold">
                            {computedMark} / {projectExamForMark?.totalMarks ?? '?'} marks
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditingRubric(group._id);
                        setRubricDraft({ ...group.rubricScores });
                      }}
                      className="text-xs"
                    >
                      📊 {isMarked ? 'Edit Rubric' : 'Score Rubric'}
                    </Button>
                    <Button
                      size="sm"
                      variant={deletingGroupId === group._id ? 'destructive' : 'ghost'}
                      onClick={() => handleDeleteGroup(group._id)}
                      className="text-xs"
                    >
                      <Trash2 className="w-4 h-4" />
                      {deletingGroupId === group._id ? 'Confirm' : ''}
                    </Button>
                  </div>
                </div>

                {/* Members */}
                <div className="flex flex-wrap gap-2">
                  {group.studentIds.length === 0 ? (
                    <span className="text-sm text-muted-foreground/50 italic">No members yet</span>
                  ) : (
                    group.studentIds.map(s => (
                      <span key={s._id} className="inline-flex items-center gap-1.5 bg-muted/60 rounded-full px-3 py-1 text-sm">
                        <span className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary">{s.name.charAt(0)}</span>
                        <span>{s.name}</span>
                        <span className="text-muted-foreground text-xs">({s.studentId})</span>
                      </span>
                    ))
                  )}
                </div>

                {/* Rubric scores display (collapsed) */}
                {isMarked && editingRubric !== group._id && (
                  <div className="grid grid-cols-5 gap-2 pt-2 border-t">
                    {RUBRIC_CRITERIA.map(c => (
                      <div key={c.key} className="text-center">
                        <p className="text-[10px] text-muted-foreground truncate">{c.label.split(' ')[0]}</p>
                        <div className={`mt-1 rounded-lg py-1 text-sm font-bold ${group.rubricScores[c.key] === 3 ? 'bg-green-500/20 text-green-600 dark:text-green-400' : group.rubricScores[c.key] === 2 ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400' : group.rubricScores[c.key] === 1 ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400' : 'bg-red-500/20 text-red-600 dark:text-red-400'}`}>
                          {group.rubricScores[c.key]}/3
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Unassigned students */}
      {unassignedStudents.length > 0 && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-5">
          <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
            <span>⏳</span> Unassigned Students
            <Badge variant="secondary">{unassignedStudents.length}</Badge>
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
          <span>🎉</span> All students are assigned to groups!
        </div>
      )}

      {/* ─── Rubric Dialog ─── */}
      <Dialog open={editingRubric !== null} onOpenChange={(open) => !open && setEditingRubric(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Rubric Scoring — Group {state.groups.find(g => g._id === editingRubric)?.groupNumber}
              {projectExam && (
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  (Total: {projectExam.totalMarks} marks)
                </span>
              )}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {RUBRIC_CRITERIA.map((criterion) => (
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
                      <div className="text-[10px] mt-1 leading-tight text-current opacity-80">{criterion.descriptions[score]}</div>
                    </button>
                  ))}
                </div>
              </div>
            ))}

            {projectExam && (
              <div className="rounded-xl bg-muted/40 border px-4 py-3 flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Calculated mark:</span>
                <span className="font-bold text-lg">
                  {calculateProjectMark(rubricDraft, projectExam.totalMarks)} / {projectExam.totalMarks}
                </span>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setEditingRubric(null)}>Cancel</Button>
              <Button onClick={() => editingRubric && handleSaveRubric(editingRubric)} disabled={savingRubric}>
                {savingRubric ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Save Scores
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ─── QR Dialog ─── */}
      <Dialog open={showQr} onOpenChange={setShowQr}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Project Registration QR Code</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-4">
            <img
              src={qrImageUrl}
              alt="Project QR Code"
              className="rounded-xl border bg-white p-3"
            />
            <p className="text-xs text-muted-foreground text-center break-all max-w-xs">{projectUrl}</p>
            <Button variant="outline" onClick={handleCopyUrl} className="w-full">
              {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
              {copied ? 'Copied!' : 'Copy URL'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ─── Start Session Dialog ─── */}
      <Dialog open={showStartDialog} onOpenChange={setShowStartDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Start Project Session</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium">Maximum members per group</label>
              <p className="text-xs text-muted-foreground mt-0.5">Students won't be able to join a full group.</p>
              <input
                type="number"
                min={1}
                max={20}
                value={maxInput}
                onChange={e => setMaxInput(e.target.value)}
                className="mt-2 w-full rounded-md border bg-background px-3 py-2 text-sm"
              />
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
