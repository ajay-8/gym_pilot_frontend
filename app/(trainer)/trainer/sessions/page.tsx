"use client";

import { useState } from "react";
import {
  useMySessions,
  useCancelSession,
  useCompleteSession,
  useMarkNoShow,
} from "@/lib/hooks/use-trainer-portal";
import type { PTSessionResponse } from "@/types/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CalendarCheck, Loader2, CheckCircle2, XCircle, AlertCircle } from "lucide-react";

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDateTime(iso: string) {
  const d = new Date(iso);
  return {
    date: d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" }),
    time: d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
  };
}

const STATUS_STYLE: Record<string, { bg: string; text: string; label: string }> = {
  scheduled: { bg: "rgba(59,130,246,0.12)",  text: "#60a5fa",  label: "Scheduled" },
  completed: { bg: "rgba(16,185,129,0.12)",  text: "#34d399",  label: "Completed" },
  cancelled: { bg: "rgba(239,68,68,0.1)",    text: "#f87171",  label: "Cancelled" },
  no_show:   { bg: "rgba(245,158,11,0.12)",  text: "#fbbf24",  label: "No Show" },
};

const MODE_STYLE: Record<string, { bg: string; text: string }> = {
  in_person: { bg: "rgba(245,158,11,0.12)", text: "#fbbf24" },
  online:    { bg: "rgba(6,182,212,0.12)",  text: "#22d3ee" },
  hybrid:    { bg: "rgba(236,72,153,0.12)", text: "#f472b6" },
};

// ── Complete Session Dialog ────────────────────────────────────────────────────

function CompleteDialog({
  session,
  onClose,
}: {
  session: PTSessionResponse;
  onClose: () => void;
}) {
  const complete = useCompleteSession();
  const [trainerNotes, setTrainerNotes] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await complete.mutateAsync({
      id: session.id,
      payload: {
        trainer_notes: trainerNotes.trim() || undefined,
      },
    });
    onClose();
  };

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Complete Session</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div>
            <Label htmlFor="trainer-notes">Session Notes</Label>
            <Textarea
              id="trainer-notes"
              value={trainerNotes}
              onChange={(e) => setTrainerNotes(e.target.value)}
              placeholder="Optional post-session notes..."
              className="mt-1 resize-none"
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={complete.isPending}>Cancel</Button>
            <Button type="submit" disabled={complete.isPending}>
              {complete.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Mark Complete
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Cancel Session Dialog ─────────────────────────────────────────────────────

function CancelDialog({
  session,
  onClose,
}: {
  session: PTSessionResponse;
  onClose: () => void;
}) {
  const cancel = useCancelSession();
  const [reason, setReason] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await cancel.mutateAsync({
      id: session.id,
      payload: { reason: reason.trim() || "Cancelled by trainer" },
    });
    onClose();
  };

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Cancel Session</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div>
            <Label htmlFor="reason">Reason (optional)</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Why is the session being cancelled?"
              className="mt-1 resize-none"
              rows={2}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={cancel.isPending}>Keep Session</Button>
            <Button
              type="submit"
              variant="destructive"
              disabled={cancel.isPending}
            >
              {cancel.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Cancel Session
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Session Row ───────────────────────────────────────────────────────────────

function SessionRow({
  session,
  onComplete,
  onCancel,
  onNoShow: _onNoShow,
}: {
  session: PTSessionResponse;
  onComplete: () => void;
  onCancel: () => void;
  onNoShow: () => void;
}) {
  const noShowMut = useMarkNoShow();
  const { date, time } = fmtDateTime(session.start_time);
  const durationMins = Math.round((new Date(session.end_time).getTime() - new Date(session.start_time).getTime()) / 60000);
  const status = STATUS_STYLE[session.status] ?? STATUS_STYLE.scheduled;
  const mode = MODE_STYLE[session.session_mode] ?? MODE_STYLE.in_person;
  const isScheduled = session.status === "scheduled";

  return (
    <div
      className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-lg"
      style={{ background: "hsl(var(--muted)/0.3)", border: "1px solid hsl(var(--border)/0.5)" }}
    >
      {/* Date / Time */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-semibold text-foreground">{date}</p>
          <p className="text-sm text-muted-foreground">{time}</p>
          <span
            className="text-[10px] font-medium px-2 py-0.5 rounded-full"
            style={{ background: mode.bg, color: mode.text }}
          >
            {session.session_mode.replace("_", " ")}
          </span>
          <span
            className="text-[10px] font-medium px-2 py-0.5 rounded-full"
            style={{ background: status.bg, color: status.text }}
          >
            {status.label}
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {durationMins} min
          {session.notes && ` · ${session.notes}`}
          {session.cancellation_reason && ` · Reason: ${session.cancellation_reason}`}
        </p>
        {session.meeting_link && (
          <a
            href={session.meeting_link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-primary hover:underline mt-0.5 inline-block"
          >
            Join meeting →
          </a>
        )}
      </div>

      {/* Actions */}
      {isScheduled && (
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs"
            style={{ borderColor: "rgba(16,185,129,0.3)", color: "#10b981" }}
            onClick={onComplete}
          >
            <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
            Complete
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs text-muted-foreground"
            onClick={onCancel}
          >
            <XCircle className="h-3.5 w-3.5 mr-1" />
            Cancel
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 text-xs text-muted-foreground"
            onClick={async () => {
              await noShowMut.mutateAsync(session.id);
            }}
            disabled={noShowMut.isPending}
          >
            <AlertCircle className="h-3.5 w-3.5 mr-1" />
            No Show
          </Button>
        </div>
      )}
    </div>
  );
}

// ── Sessions Tab ──────────────────────────────────────────────────────────────

function SessionsTab({
  status,
  emptyMsg,
}: {
  status: string;
  emptyMsg: string;
}) {
  const params = { status, page_size: 50 };

  const { data, isLoading } = useMySessions(params);
  const sessions = data?.items ?? [];

  const [completeTarget, setCompleteTarget] = useState<PTSessionResponse | undefined>();
  const [cancelTarget, setCancelTarget] = useState<PTSessionResponse | undefined>();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!sessions.length) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <CalendarCheck className="h-8 w-8 text-muted-foreground opacity-30 mb-2" />
        <p className="text-sm text-muted-foreground">{emptyMsg}</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {sessions.map((s) => (
        <SessionRow
          key={s.id}
          session={s}
          onComplete={() => setCompleteTarget(s)}
          onCancel={() => setCancelTarget(s)}
          onNoShow={() => {}}
        />
      ))}

      {completeTarget && (
        <CompleteDialog session={completeTarget} onClose={() => setCompleteTarget(undefined)} />
      )}
      {cancelTarget && (
        <CancelDialog session={cancelTarget} onClose={() => setCancelTarget(undefined)} />
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

const TABS = [
  { key: "scheduled",  label: "Upcoming",   emptyMsg: "No upcoming sessions" },
  { key: "completed",  label: "Past",        emptyMsg: "No completed sessions yet" },
  { key: "cancelled",  label: "Cancelled",   emptyMsg: "No cancelled sessions" },
  { key: "no_show",    label: "No-Show",     emptyMsg: "No no-show sessions" },
] as const;

export default function SessionsPage() {
  const [activeTab, setActiveTab] = useState<string>("scheduled");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Sessions</h2>
        <p className="text-sm text-muted-foreground mt-1">View and manage your PT sessions</p>
      </div>

      <Card>
        <CardContent className="p-0">
          {/* Tab bar */}
          <div
            className="flex"
            style={{ borderBottom: "1px solid hsl(var(--border))" }}
          >
            {TABS.map((tab) => {
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className="flex-1 py-3 text-sm font-medium transition-colors"
                  style={{
                    color: isActive ? "#8b5cf6" : "hsl(var(--muted-foreground))",
                    borderBottom: isActive ? "2px solid #8b5cf6" : "2px solid transparent",
                    background: "transparent",
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="p-4">
            {TABS.map((tab) =>
              activeTab === tab.key ? (
                <SessionsTab key={tab.key} status={tab.key} emptyMsg={tab.emptyMsg} />
              ) : null
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
