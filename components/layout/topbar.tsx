"use client";

import { useTheme } from "@/components/providers/theme-provider";
import { cn } from "@/lib/utils";
import {
  LayoutGrid,
  LayoutList,
  Moon,
  Search,
  Sun,
  X
} from "lucide-react";
import { useState } from "react";

interface TopbarProps {
  title?: string;
  viewMode: "grid" | "list";
  onViewModeChange: (mode: "grid" | "list") => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export function Topbar({
  title = "Drive",
  viewMode,
  onViewModeChange,
  searchQuery,
  onSearchChange,
}: TopbarProps) {
  const [searchFocused, setSearchFocused] = useState(false);
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="flex items-center gap-3 h-14 px-5 border-b border-border bg-background/80 backdrop-blur-sm">
      <h2 className="min-w-35 text-base font-semibold text-foreground">
        {title}
      </h2>

      <div
        className={cn(
          "flex items-center gap-2 flex-1 max-w-xl h-8 px-3 rounded-lg border transition-all",
          searchFocused
            ? "border-primary/50 bg-secondary/50 glow-accent"
            : "border-border bg-secondary/30"
        )}
      >
        <Search className="size-3.5 text-muted-foreground shrink-0" />
        <input
          type="text"
          placeholder="Search files and folders..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
          className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange("")}
            className="cursor-pointer text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            <X className="size-3.5" />
          </button>
        )}
      </div>

      <div className="flex items-center gap-1">
        <div className="flex items-center bg-secondary/50 rounded-lg p-0.5">
          <button
            onClick={() => onViewModeChange("grid")}
            className={cn(
              "flex size-7 cursor-pointer items-center justify-center rounded-md transition-all",
              viewMode === "grid"
                ? "bg-primary/15 text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <LayoutGrid className="size-3.5" />
          </button>
          <button
            onClick={() => onViewModeChange("list")}
            className={cn(
              "flex size-7 cursor-pointer items-center justify-center rounded-md transition-all",
              viewMode === "list"
                ? "bg-primary/15 text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <LayoutList className="size-3.5" />
          </button>
        </div>

        <button
          onClick={toggleTheme}
          className="flex size-8 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
        >
          {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
        </button>
      </div>
    </header>
  );
}
