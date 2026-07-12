"use client";

import { fetcher } from "@/lib/fetcher";
import type { FileItem } from "@/lib/types";
import useSWR from "swr";

export function useDriveSearch(query: string) {
  const key = query
    ? `/api/drive/search?q=${encodeURIComponent(query)}`
    : null;
  return useSWR<FileItem[]>(key, fetcher);
}
