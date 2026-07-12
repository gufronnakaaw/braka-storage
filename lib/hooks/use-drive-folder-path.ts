"use client";

import { fetcher } from "@/lib/fetcher";
import useSWR from "swr";

export function useDriveFolderPath(folderId: string | null) {
  const key = folderId
    ? `/api/drive/folder-path?folderId=${encodeURIComponent(folderId)}`
    : null;
  return useSWR<string[]>(key, fetcher);
}
