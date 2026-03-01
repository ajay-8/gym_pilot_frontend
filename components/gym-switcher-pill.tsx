"use client";

import { useState } from "react";
import { Building2, ArrowLeftRight, Check, Loader2, Plus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useMyGyms } from "@/lib/hooks/use-gyms";
import { useSetGymSession } from "@/lib/hooks/use-auth";
import { AddGymDialog } from "@/components/add-gym-dialog";
import type { GymContextResponse } from "@/types/api";

interface GymSwitcherPillProps {
  gymContext: GymContextResponse;
  /** RGB triplet for the accent colour, e.g. "16,185,129" for emerald */
  rgb: string;
  /** Label shown under the gym name, e.g. "Admin" | "Trainer" | "Member" */
  roleLabel: string;
}

export function GymSwitcherPill({ gymContext, rgb, roleLabel }: GymSwitcherPillProps) {
  const [addGymOpen, setAddGymOpen] = useState(false);
  const { data: gymsData } = useMyGyms({ page: 1, page_size: 50 });
  const setGymSession = useSetGymSession();

  const gyms = gymsData?.items ?? [];

  const pillStyle = {
    background: `rgba(${rgb},0.06)`,
    border: `1px solid rgba(${rgb},0.14)`,
  };
  const iconBgStyle = { background: `rgba(${rgb},0.15)` };
  const iconStyle = { color: `rgb(${rgb})` };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2.5 group transition-colors hover:bg-white/5 text-left"
            style={pillStyle}
          >
            <div
              className="h-7 w-7 rounded-md flex items-center justify-center flex-shrink-0"
              style={iconBgStyle}
            >
              {setGymSession.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" style={iconStyle} />
              ) : (
                <Building2 className="h-3.5 w-3.5" style={iconStyle} />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold truncate text-foreground">{gymContext.gym_name}</p>
              <p className="text-[10px] text-muted-foreground">{roleLabel}</p>
            </div>
            <ArrowLeftRight className="h-3 w-3 flex-shrink-0 text-muted-foreground opacity-40 group-hover:opacity-80 transition-opacity" />
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent side="right" align="start" className="w-56">
          {gyms.length > 1 && (
            <>
              <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
                Switch gym
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
            </>
          )}
          {gyms.map((gym) => {
            const isActive = gym.id === gymContext.gym_id;
            return (
              <DropdownMenuItem
                key={gym.id}
                disabled={isActive || setGymSession.isPending}
                onClick={() => {
                  if (!isActive) setGymSession.mutate({ gym_id: gym.id });
                }}
                className="flex items-center gap-2 cursor-pointer"
              >
                <span className="flex-1 truncate">{gym.name}</span>
                {isActive && <Check className="h-3.5 w-3.5 text-primary flex-shrink-0" />}
              </DropdownMenuItem>
            );
          })}
          {gymContext.roles.some((r) => ["owner", "admin"].includes(r)) && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setAddGymOpen(true)}
                className="flex items-center gap-2 cursor-pointer text-muted-foreground"
              >
                <Plus className="h-3.5 w-3.5 flex-shrink-0" />
                <span>Add New Gym</span>
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <AddGymDialog open={addGymOpen} onOpenChange={setAddGymOpen} />
    </>
  );
}
