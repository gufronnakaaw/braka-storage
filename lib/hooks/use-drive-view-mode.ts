"use client";

import { useEffect, useState } from "react";

type ViewMode = "grid" | "list";
const STORAGE_KEY = "braka-view-mode";

export function useDriveViewMode() {
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as ViewMode | null;
    if (saved && saved !== viewMode) {
      setViewMode(saved);
    }
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, viewMode);
  }, [viewMode]);

  return { viewMode, setViewMode, hydrated };
}
