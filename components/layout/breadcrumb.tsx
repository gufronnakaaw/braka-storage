"use client";

import type { FolderBreadcrumb } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ChevronRight, Home } from "lucide-react";

interface BreadcrumbProps {
  items: FolderBreadcrumb[];
  onNavigate: (folderId: string | null) => void;
}

export function Breadcrumb({ items, onNavigate }: BreadcrumbProps) {
  return (
    <nav className="flex items-center gap-1 px-5 py-2 text-xs text-muted-foreground overflow-x-auto">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <div key={item.id ?? "root"} className="flex items-center gap-1 shrink-0">
            {index > 0 && (
              <ChevronRight className="size-3 text-muted-foreground/50" />
            )}
            <button
              onClick={() => onNavigate(item.id)}
              className={cn(
                "flex cursor-pointer items-center gap-1 rounded px-1.5 py-0.5 transition-colors",
                isLast
                  ? "text-foreground font-medium cursor-default"
                  : "hover:bg-secondary hover:text-foreground"
              )}
              disabled={isLast}
            >
              {index === 0 && <Home className="size-3" />}
              {item.name}
            </button>
          </div>
        );
      })}
    </nav>
  );
}
