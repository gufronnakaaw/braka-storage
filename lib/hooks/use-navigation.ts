"use client";

import type { SidebarView } from "@/components/layout/sidebar";
import { useRouter } from "next/navigation";
import { useCallback } from "react";

const ROUTES: Record<SidebarView, string> = {
  drive: "/",
  logs: "/logs",
  apiKeys: "/api-keys",
};

export function useNavigation() {
  const router = useRouter();

  const navigateTo = useCallback(
    (view: SidebarView) => {
      router.push(ROUTES[view]);
    },
    [router],
  );

  return { navigateTo };
}
