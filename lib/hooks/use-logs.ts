"use client";

import { fetcher } from "@/lib/fetcher";
import type { PaginatedLogs, TimeFilter } from "@/lib/types";
import useSWR from "swr";

export function useLogs(page: number, timeFilter: TimeFilter) {
  const key = `/api/logs?page=${page}&timeFilter=${timeFilter}`;
  return useSWR<PaginatedLogs>(key, fetcher);
}
