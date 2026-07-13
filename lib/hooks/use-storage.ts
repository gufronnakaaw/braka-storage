"use client";

import { fetcher } from "@/lib/fetcher";
import type { StorageUsage } from "@/lib/types";
import useSWR from "swr";

export function useStorageUsage() {
  return useSWR<StorageUsage>("/api/drive/storage", fetcher, {
    revalidateOnFocus: true,
    refreshInterval: 30_000,
  });
}