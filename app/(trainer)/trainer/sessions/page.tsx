"use client";

import { useState } from "react";
import {
  useMySessions,
  useMyClients,
  useLogSession,
} from "@/lib/hooks/use-trainer-portal";
import type { PTClientSummary, PTActivePackageSummary } from "@/types/api";
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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CalendarCheck, ClipboardList, Loader2 } from "lucide-react";
import { format, parseISO } from "date-fns";

// ── Helpers ───────────────────────────────────────────────────────────────────

function primaryPkg(client: PTClientSummary): PTActivePackageSummary | null {
  return client.active_packages.find((p) => p.credits_remaining > 0) ?? client.active_packages[0] ?? null;
}

function clientName(c: PTClientSummary): string {
  return [c.first_name, c.last_name].filter(Boolean).join(" ") || "Client";
}

function durationMins(start: string, end: string): number {
  return Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60000);
}

const MODE_LABELS: Record<string, string> = {
  in_person: "In Person",
  online: "Online",
  hybrid: "Hybrid",
};

const MODE_STYLE: Record<string, { bg: string; text: string }> = {
  in_person: { bg: "rgba(245,158,11,0.12)", text: "#fbbf24" },
  online:    { bg: "rgba(6,182,212,0.12)",  text: "#22d3ee" },
  hybrid:    { bg: "rgba(236,72,153,0.12)", text: "#f472b6" },
};

// ── Log Session Dialog ────────────────────────────────────────────────────────

function LogSessionDialog({ onClose }: { onClose: () => void }) {
  const logSession = useLogSession();
  const { data: clientsData, isLoading: clientsLoading } = useMyClients({ page_size: 100 });

  const clients = (clientsData?.items ?? []).filter((c) => c.active_packages.length > 0);

  const today = new Date().toISOString().slice(0, 10);
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [selectedPurchaseId, setSelectedPurchaseId] = useState<string>("");
  const [date, setDate] = useState(today);
  const [duration, setDuration] = useState(60);
  const [mode, setMode] = useState("in_person");
  const [notes, setNotes] = useState("");
  const [trainerNotes, setTrainerNotes] = useState("");
  const [err, setErr] = useState<string | null>(null);

  const selectedClient = clients.find((c) => c.participant_id === selectedClientId) ?? null;
  const packages = selectedClient?.active_packages ?? [];

  const handleClientChange = (val: string) => {
    setSelectedClientId(val);
    const client = clients.find((c) => c.participant_id === val);
    const pkg = client ? (primaryPkg(client) ?? client.active_packages[0]) : null;
    setSelectedPurchaseId(pkg?.purchase_id ?? "");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    if (!selectedClientId || !selectedPurchaseId) {
      setErr("Select a client and package.");
      return;
    }
    try {
      await logSession.mutateAsync({
        member_id: selectedClientId,
        package_purchase_id: selectedPurchaseId,
        session_date: date,
        duration_minutes: duration,
        session_mode: mode,
        notes: notes.trim() || undefined,
        trainer_notes: trainerNotes.trim() || undefined,
      });
      onClose();
    } catch (e: any) {
      setErr(e?.response?.data?.detail ?? "Failed to log session.");
    }
  };

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Log Session</DialogTitle>
        </DialogHeader>
        <p className="text-xs text-muted-foreground -mt-1 mb-1">
          Record a session that just happened. One credit will be deducted immediately.
        </p>
        {clientsLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        ) : clients.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            No clients with active packages.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <Label>Client</Label>
              <Select value={selectedClientId} onValueChange={handleClientChange}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select client..." />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((c) => (
                    <SelectItem key={c.participant_id} value={c.participant_id}>
                      {clientName(c)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {packages.length > 1 && (
              <div>
                <Label>Package</Label>
                <Select value={selectedPurchaseId} onValueChange={setSelectedPurchaseId}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select package..." />
                  </SelectTrigger>
                  <SelectContent>
                    {packages.map((p) => (
                      <SelectItem key={p.purchase_id} value={p.purchase_id}>
                        {p.name} ({p.credits_remaining} credits)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <Label>Date</Label>
              <Input
                type="date"
                className="mt-1"
                value={date}
                max={today}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Duration (min)</Label>
                <Input
                  type="number"
                  className="mt-1"
                  value={duration}
                  min={15}
                  max={240}
                  step={15}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  required
                />
              </div>
              <div>
                <Label>Mode</Label>
                <Select value={mode} onValueChange={setMode}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(MODE_LABELS).map(([val, label]) => (
                      <SelectItem key={val} value={val}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Session Notes (optional)</Label>
              <Textarea
                className="mt-1 resize-none"
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="What was covered..."
              />
            </div>

            <div>
              <Label>Trainer Notes (optional)</Label>
              <Textarea
                className="mt-1 resize-none"
                rows={2}
                value={trainerNotes}
                onChange={(e) => setTrainerNotes(e.target.value)}
                placeholder="Progress, observations..."
              />
            </div>

            {err && <p className="text-xs text-red-400">{err}</p>}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose} disabled={logSession.isPending}>
                Cancel
              </Button>
              <Button type="submit" disabled={logSession.isPending || !selectedClientId || !selectedPurchaseId}>
                {logSession.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Log Session
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function SessionsPage() {
  const { data, isLoading } = useMySessions({ status: "completed", page_size: 50 });
  const [logOpen, setLogOpen] = useState(false);

  const sessions = data?.items ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Sessions</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Session history. Use "Log Session" after each training session to deduct a credit.
          </p>
        </div>
        <Button onClick={() => setLogOpen(true)}>
          <ClipboardList className="h-4 w-4 mr-2" />
          Log Session
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : sessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <CalendarCheck className="h-10 w-10 text-muted-foreground opacity-25 mb-3" />
              <p className="text-sm font-medium text-muted-foreground">No sessions logged yet</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                After a client trains with you, click "Log Session" to record it and deduct a credit.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {sessions.map((s) => {
                const modeStyle = MODE_STYLE[s.session_mode] ?? MODE_STYLE.in_person;
                const dur = durationMins(s.start_time, s.end_time);
                const name = [s.member_first_name, s.member_last_name].filter(Boolean).join(" ") || "Client";
                const dateStr = s.completed_at
                  ? format(parseISO(s.completed_at), "EEE dd MMM yyyy")
                  : format(parseISO(s.start_time), "EEE dd MMM yyyy");

                return (
                  <div key={s.id} className="flex items-center gap-3 px-4 py-3">
                    <div
                      className="h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-semibold"
                      style={{ background: "rgba(139,92,246,0.15)", color: "#8b5cf6" }}
                    >
                      {(s.member_first_name?.[0] ?? "?").toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{name}</p>
                      <p className="text-xs text-muted-foreground">
                        {dateStr} · {dur} min
                        {s.session_type && ` · ${s.session_type}`}
                      </p>
                      {s.trainer_notes && (
                        <p className="text-xs mt-0.5" style={{ color: "#a78bfa" }}>
                          {s.trainer_notes}
                        </p>
                      )}
                    </div>
                    <span
                      className="text-[10px] font-medium px-2 py-0.5 rounded-full flex-shrink-0"
                      style={{ background: modeStyle.bg, color: modeStyle.text }}
                    >
                      {MODE_LABELS[s.session_mode] ?? s.session_mode}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {logOpen && <LogSessionDialog onClose={() => setLogOpen(false)} />}
    </div>
  );
}
