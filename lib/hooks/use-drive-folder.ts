"use client";

import { fetcher } from "@/lib/fetcher";
import type { FileItem } from "@/lib/types";
import useSWR from "swr";

export function useDriveFolder(id: string | null | undefined) {
  const key = id
    ? `/api/drive/folders/${encodeURIComponent(id)}`
    : null;
  return useSWR<FileItem>(key, fetcher);
}
