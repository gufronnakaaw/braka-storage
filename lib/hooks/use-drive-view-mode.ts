"use client";

import { useEffect, useState } from "react";

type ViewMode = "grid" | "list";
const STORAGE_KEY = "braka-view-mode";

export function useDriveViewMode() {
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === "grid" || saved === "list") return saved;
    }
    return "grid";
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, viewMode);
  }, [viewMode]);

  return { viewMode, setViewMode };
}
