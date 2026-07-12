"use client";

import { fetcher } from "@/lib/fetcher";
import type { FolderBreadcrumb } from "@/lib/types";
import useSWR from "swr";

export function useDriveBreadcrumbs(folderId: string | null | undefined) {
  const key =
    folderId === undefined
      ? null
      : folderId
        ? `/api/drive/breadcrumbs?folderId=${encodeURIComponent(folderId)}`
        : "/api/drive/breadcrumbs";
  return useSWR<FolderBreadcrumb[]>(key, fetcher);
}
