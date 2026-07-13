"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useStorageUsage } from "@/lib/hooks";
import { cn } from "@/lib/utils";
import {
  HardDrive,
  KeyRound,
  LogOut,
  ScrollText,
} from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import Image from "next/image";

export type SidebarView = "drive" | "apiKeys" | "logs";

interface SidebarProps {
  activeView: SidebarView;
  onViewChange: (view: SidebarView) => void;
}

const navItems: Array<{
  id: SidebarView;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: "drive", label: "Drive", icon: HardDrive },
  { id: "apiKeys", label: "API Keys", icon: KeyRound },
  { id: "logs", label: "Logs", icon: ScrollText },
];

export function Sidebar({ activeView, onViewChange }: SidebarProps) {
  const session = useSession();
  const { data: storage } = useStorageUsage();

  const usedGB = storage ? (storage.usedBytes / (1024 * 1024 * 1024)).toFixed(1) : "0.0";
  const maxGB = storage ? (storage.maxBytes / (1024 * 1024 * 1024)).toFixed(0) : "10";
  const percentage = storage?.percentage ?? 0;

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
      <div className="flex h-14 items-center justify-between border-b border-sidebar-border px-4">
        <div className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center overflow-hidden rounded-md bg-sidebar-primary/10 ring-1 ring-sidebar-border">
            <Image
              src="/braka.png"
              alt="Braka logo"
              width={20}
              height={20}
              className="size-5 object-contain"
              priority
            />
          </div>
          <p className="text-sm font-semibold tracking-wide">Braka Nusa Core</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-2 pb-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onViewChange(item.id)}
              className={cn(
                "flex h-9 w-full cursor-pointer items-center gap-2 rounded-lg px-3 text-left text-sm transition-colors",
                isActive
                  ? "bg-sidebar-primary/15 text-sidebar-primary"
                  : "text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-foreground"
              )}
            >
              <Icon className="size-4" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="mt-auto space-y-3 p-3 pt-0">
        <div className="rounded-lg border border-sidebar-border bg-sidebar-accent/60 p-3">
          <p className="text-[11px] uppercase tracking-wider text-sidebar-foreground/60">Storage</p>
          <p className="mt-1 text-xs text-sidebar-foreground/80">{usedGB} GB of {maxGB} GB used</p>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-black/20">
            <div className="h-full rounded-full bg-sidebar-primary transition-all duration-500" style={{ width: `${percentage}%` }} />
          </div>
        </div>

        <div className="rounded-lg border border-sidebar-border bg-sidebar-accent/60 p-3">
          <p className="text-[11px] uppercase tracking-wider text-sidebar-foreground/60">Logged In</p>
          <div className="mt-2 flex items-center gap-2.5">
            <Avatar size="sm">
              <AvatarFallback className="bg-sidebar-primary/20 text-sidebar-primary">
                {session.data?.user?.name?.[0] || "?"}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-sidebar-foreground">
                {session.data?.user?.name || "-"}
              </p>
              <p className="truncate text-[11px] text-sidebar-foreground/70">
                {session.data?.user?.username || "-"}
              </p>
            </div>
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-md text-sidebar-foreground/50 transition-colors hover:bg-destructive/10 hover:text-destructive"
              title="Sign out"
            >
              <LogOut className="size-3.5" />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
