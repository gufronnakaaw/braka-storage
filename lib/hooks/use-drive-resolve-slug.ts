"use client";

import { fetcher } from "@/lib/fetcher";
import useSWR from "swr";

export function useDriveResolveSlug(slug: string[]) {
  const key =
    slug.length > 0
      ? `/api/drive/resolve?${slug.map((s) => `slug=${encodeURIComponent(s)}`).join("&")}`
      : null;
  return useSWR<string | null>(key, fetcher);
}
