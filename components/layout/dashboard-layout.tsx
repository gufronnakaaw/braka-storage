"use client";

import { Sidebar, type SidebarView } from "@/components/layout/sidebar";
import { useMobileSidebar, useNavigation } from "@/lib/hooks";
import { Menu } from "lucide-react";
import type { ReactNode } from "react";

interface DashboardLayoutProps {
  activeView: SidebarView;
  mobileTitle?: string;
  mobileSubtitle?: string;
  children: ReactNode;
}

export function DashboardLayout({
  activeView,
  mobileTitle,
  mobileSubtitle,
  children,
}: DashboardLayoutProps) {
  const { navigateTo } = useNavigation();
  const { isOpen: sidebarOpen, open: openSidebar, close: closeSidebar } = useMobileSidebar();

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <div className="hidden md:block">
        <Sidebar activeView={activeView} onViewChange={navigateTo} />
      </div>

      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            onClick={closeSidebar}
          />
          <div className="absolute inset-y-0 left-0 z-50 w-64">
            <Sidebar
              activeView={activeView}
              onViewChange={(view) => {
                navigateTo(view);
                closeSidebar();
              }}
            />
          </div>
        </div>
      )}

      <div className="flex flex-1 flex-col min-w-0 overflow-y-auto">
        <div className="flex items-center gap-3 border-b border-border/60 px-4 py-3 md:hidden">
          <button
            type="button"
            onClick={openSidebar}
            className="flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted cursor-pointer"
          >
            <Menu className="size-5" />
          </button>
          {mobileSubtitle ? (
            <div>
              <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                {mobileSubtitle}
              </p>
              <h1 className="text-base font-semibold text-foreground">{mobileTitle}</h1>
            </div>
          ) : (
            <h1 className="truncate text-base font-semibold text-foreground">{mobileTitle}</h1>
          )}
        </div>

        {children}
      </div>
    </div>
  );
}
