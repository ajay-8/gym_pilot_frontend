"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useMembershipAuditHistory } from "@/lib/hooks/use-members";
import { Calendar, Clock, User, CreditCard, RefreshCw, Ban, Snowflake, Sun, History } from "lucide-react";
import { fmtDate as formatDate, fmtDateTime as formatDateTime } from "@/lib/utils/formatting";

// Helper function to get action badge variant
function getActionBadgeVariant(
  action: string
): "default" | "success" | "warning" | "destructive" | "secondary" {
  if (action.includes("created") || action.includes("renewed")) {
    return "success";
  }
  if (action.includes("cancelled")) {
    return "destructive";
  }
  if (action.includes("frozen")) {
    return "warning";
  }
  if (action.includes("unfrozen")) {
    return "default";
  }
  return "secondary";
}

// Helper function to format action text
function formatAction(action: string): string {
  const actionMap: Record<string, string> = {
    "membership.created": "Created",
    "membership.assigned": "Assigned",
    "membership.renewed": "Renewed",
    "membership.cancelled": "Cancelled",
    "membership.frozen": "Frozen",
    "membership.unfrozen": "Unfrozen",
  };
  return actionMap[action] || action;
}

// Helper function to get action icon
function getActionIcon(action: string) {
  if (action.includes("created") || action.includes("assigned")) {
    return <CreditCard className="h-4 w-4" />;
  }
  if (action.includes("renewed")) {
    return <RefreshCw className="h-4 w-4" />;
  }
  if (action.includes("cancelled")) {
    return <Ban className="h-4 w-4" />;
  }
  if (action.includes("frozen")) {
    return <Snowflake className="h-4 w-4" />;
  }
  if (action.includes("unfrozen")) {
    return <Sun className="h-4 w-4" />;
  }
  return <Calendar className="h-4 w-4" />;
}

interface MembershipHistoryDialogProps {
  userId: string;
}

export function MembershipHistoryDialog({ userId }: MembershipHistoryDialogProps) {
  const [open, setOpen] = useState(false);

  // Only fetch when dialog is open
  const { data, isLoading, error } = useMembershipAuditHistory(userId, open);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <History className="mr-2 h-4 w-4" />
          View History
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle>Membership History</DialogTitle>
          <DialogDescription>
            Complete timeline of all membership changes and updates
          </DialogDescription>
        </DialogHeader>

        <div className="h-[calc(85vh-120px)] overflow-y-auto pr-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground">Loading membership history...</div>
            </div>
          ) : error ? (
            <div className="text-sm text-destructive">
              Failed to load membership history. Please try again.
            </div>
          ) : data && data.events && data.events.length > 0 ? (
            <div className="space-y-4">
              {data.events.map((event: any, index: number) => (
                <div
                  key={event.id}
                  className="relative pl-8 pb-6 last:pb-0"
                >
                  {/* Timeline line */}
                  {index < data.events.length - 1 && (
                    <div className="absolute left-2 top-6 bottom-0 w-[2px] bg-border"></div>
                  )}

                  {/* Timeline dot */}
                  <div className="absolute left-0 top-1 h-4 w-4 rounded-full border-2 border-background bg-border flex items-center justify-center">
                    <div className="h-2 w-2 rounded-full bg-primary"></div>
                  </div>

                  {/* Event content */}
                  <div className="border rounded-lg p-4 space-y-3 hover:bg-muted/50 transition-colors">
                    {/* Header with Action and Timestamp */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getActionIcon(event.action)}
                        <span className="font-semibold">{formatAction(event.action)}</span>
                        <Badge variant={getActionBadgeVariant(event.action)}>
                          {formatAction(event.action)}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>{formatDateTime(event.created_at)}</span>
                      </div>
                    </div>

                    {/* User who made the change */}
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <User className="h-3 w-3" />
                      <span>by {event.user_email}</span>
                    </div>

                    {/* New values (what changed) */}
                    {event.new_values && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm pt-2 border-t">
                        {event.new_values.plan_name && (
                          <div>
                            <p className="text-xs text-muted-foreground">Plan</p>
                            <p className="font-medium">{event.new_values.plan_name}</p>
                          </div>
                        )}
                        {event.new_values.start_date && (
                          <div>
                            <p className="text-xs text-muted-foreground">Start Date</p>
                            <p className="font-medium">{formatDate(event.new_values.start_date)}</p>
                          </div>
                        )}
                        {event.new_values.end_date && (
                          <div>
                            <p className="text-xs text-muted-foreground">End Date</p>
                            <p className="font-medium">
                              {event.new_values.end_date ? formatDate(event.new_values.end_date) : "Unlimited"}
                            </p>
                          </div>
                        )}
                        {event.new_values.amount_paid && (
                          <div>
                            <p className="text-xs text-muted-foreground">Amount</p>
                            <p className="font-medium">₹{event.new_values.amount_paid}</p>
                          </div>
                        )}
                        {event.new_values.status && (
                          <div>
                            <p className="text-xs text-muted-foreground">Status</p>
                            <p className="font-medium capitalize">{event.new_values.status}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Old values (what it was before) */}
                    {event.old_values && (
                      <div className="text-xs text-muted-foreground pt-2 border-t">
                        <p className="font-medium mb-1">Previous:</p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          {event.old_values.plan_name && (
                            <span>Plan: {event.old_values.plan_name}</span>
                          )}
                          {event.old_values.start_date && (
                            <span>Start: {formatDate(event.old_values.start_date)}</span>
                          )}
                          {event.old_values.end_date && (
                            <span>End: {formatDate(event.old_values.end_date)}</span>
                          )}
                          {event.old_values.status && (
                            <span>Status: {event.old_values.status}</span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Calendar className="h-12 w-12 text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">
                No membership history found
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
