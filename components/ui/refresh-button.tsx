import { RefreshCw } from "lucide-react";

interface RefreshButtonProps {
  onClick: () => void;
  label?: string;
}

export function RefreshButton({ onClick, label = "Refresh" }: RefreshButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-8 cursor-pointer items-center gap-1.5 rounded-lg border border-border px-3 text-xs text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
    >
      <RefreshCw className="size-3" />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}
