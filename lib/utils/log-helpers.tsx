import {
  FileText,
  KeyRound,
  LogIn,
  LogOut,
  Pencil,
  Plus,
  ScrollText,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  Upload,
} from "lucide-react";
import type { ComponentType } from "react";

const ACTION_ICON_MAP: Record<string, ComponentType<{ className?: string }>> = {
  CREATE: Plus,
  DELETE: Trash2,
  RENAME: Pencil,
  UPLOAD: Upload,
  DOWNLOAD: FileText,
  LOGIN: LogIn,
  LOGOUT: LogOut,
  LOGIN_FAILED: ShieldAlert,
  API_KEY_CREATE: KeyRound,
  API_KEY_REVOKE: ShieldCheck,
};

const ACTION_COLOR_MAP: Record<string, string> = {
  CREATE: "bg-emerald-500/10 text-emerald-400",
  UPLOAD: "bg-emerald-500/10 text-emerald-400",
  API_KEY_CREATE: "bg-emerald-500/10 text-emerald-400",
  DELETE: "bg-red-500/10 text-red-400",
  TRASH: "bg-red-500/10 text-red-400",
  API_KEY_REVOKE: "bg-red-500/10 text-red-400",
  LOGIN_FAILED: "bg-red-500/10 text-red-400",
  RENAME: "bg-amber-500/10 text-amber-400",
  MOVE: "bg-amber-500/10 text-amber-400",
  LOGIN: "bg-blue-500/10 text-blue-400",
  LOGOUT: "bg-muted text-muted-foreground",
};

export function getActionIcon(action: string) {
  const Icon = ACTION_ICON_MAP[action] ?? ScrollText;
  return <Icon className="size-3.5" />;
}

export function getActionColor(action: string): string {
  return ACTION_COLOR_MAP[action] ?? "bg-secondary text-muted-foreground";
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}
