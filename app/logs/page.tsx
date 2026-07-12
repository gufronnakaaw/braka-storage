"use client";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { PageHeader } from "@/components/layout/page-header";
import { RefreshButton } from "@/components/ui/refresh-button";
import { CustomSelect } from "@/components/ui/select";
import {
  fetchLogs,
  TIME_FILTERS,
  type LogEntry,
  type TimeFilter,
} from "@/lib/api/logs";
import { cn, formatDate, getActionColor, getActionIcon } from "@/lib/utils";
import { toastError } from "@/lib/utils/toast";
import {
  ArrowLeft,
  ArrowRight,
  ScrollText,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

export default function LogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("1d");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const loadLogs = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchLogs(page, timeFilter);
      setLogs(data.data);
      setTotalPages(data.totalPages);
      setTotal(data.total);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setError(msg);
      toastError(err, "Failed to load logs");
    } finally {
      setIsLoading(false);
    }
  }, [page, timeFilter]);

  useEffect(() => {
    void loadLogs();
  }, [loadLogs]);

  function handleTimeFilterChange(value: string) {
    setTimeFilter(value as TimeFilter);
    setPage(1);
  }

  return (
    <DashboardLayout activeView="logs" mobileTitle="Logs" mobileSubtitle="Security">
      <PageHeader label="Security" title="Activity Logs" />

      <div className="space-y-3 p-3 sm:space-y-4 sm:p-6">
        <section className="rounded-xl border border-border bg-card/60 p-3 sm:p-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground sm:text-xs">Filter</p>
              <p className="mt-1 text-xs text-foreground sm:text-sm">
                {total} event{total !== 1 ? "s" : ""} found
              </p>
            </div>
            <RefreshButton onClick={() => void loadLogs()} />
          </div>
          <div className="mt-3 flex flex-col gap-2 sm:mt-4 sm:flex-row">
            <CustomSelect
              value={timeFilter}
              onChange={handleTimeFilterChange}
              options={TIME_FILTERS}
              className="w-full sm:w-48"
            />
          </div>
        </section>

        <section className="rounded-xl border border-border bg-card/60 p-3 sm:p-4">
          {isLoading ? (
            <div className="space-y-3 py-8">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="size-6 rounded bg-secondary/50 animate-pulse" />
                  <div className="h-3 flex-1 rounded bg-secondary/50 animate-pulse" />
                  <div className="h-3 w-20 rounded bg-secondary/30 animate-pulse" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="py-8 text-center">
              <p className="text-sm text-destructive">{error}</p>
              <button
                onClick={() => void loadLogs()}
                className="mt-2 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
              >
                Try again
              </button>
            </div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-8">
              <div className="flex items-center justify-center size-12 rounded-xl bg-secondary/50">
                <ScrollText className="size-6 text-muted-foreground/50" />
              </div>
              <p className="text-sm text-muted-foreground">No activity logs found</p>
            </div>
          ) : (
            <>
              <div className="hidden overflow-hidden rounded-lg border border-border/80 bg-background/60 md:block">
                <table className="min-w-full text-left text-xs">
                  <thead className="border-b border-border bg-card/80">
                    <tr className="text-muted-foreground">
                      <th className="px-3 py-2 font-medium">Action</th>
                      <th className="px-3 py-2 font-medium">Description</th>
                      <th className="px-3 py-2 font-medium">Entity</th>
                      <th className="px-3 py-2 font-medium">By</th>
                      <th className="px-3 py-2 text-right font-medium">Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log) => (
                      <tr key={log.id} className="border-b border-border/70 last:border-b-0">
                        <td className="px-3 py-2.5">
                          <span
                            className={cn(
                              "inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-[10px] uppercase tracking-[0.08em] font-medium",
                              getActionColor(log.action),
                            )}
                          >
                            {getActionIcon(log.action)}
                            {log.action}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-sm text-foreground">
                          <p className="max-w-xs truncate">{log.description}</p>
                        </td>
                        <td className="px-3 py-2.5 text-muted-foreground">
                          <span className="capitalize">{log.entity_type.toLowerCase()}</span>
                          {log.entity_name && (
                            <span className="ml-1 text-foreground/70">&mdash; {log.entity_name}</span>
                          )}
                        </td>
                        <td className="px-3 py-2.5 text-muted-foreground">
                          {log.performed_by}
                        </td>
                        <td className="px-3 py-2.5 text-right text-muted-foreground whitespace-nowrap">
                          {formatDate(log.created_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="space-y-2 md:hidden">
                {logs.map((log) => (
                  <div key={log.id} className="rounded-lg border border-border/80 bg-background/60 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] uppercase tracking-[0.08em] font-medium",
                          getActionColor(log.action),
                        )}
                      >
                        {getActionIcon(log.action)}
                        {log.action}
                      </span>
                      <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                        {formatDate(log.created_at)}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-foreground">{log.description}</p>
                    <div className="mt-1.5 flex items-center gap-2 text-[11px] text-muted-foreground">
                      <span className="capitalize">{log.entity_type.toLowerCase()}</span>
                      <span>&middot;</span>
                      <span>{log.performed_by}</span>
                    </div>
                  </div>
                ))}
              </div>

              {totalPages > 1 && (
                <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-3">
                  <p className="text-xs text-muted-foreground">
                    Page {page} of {totalPages}
                  </p>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      className="flex size-7 cursor-pointer items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <ArrowLeft className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={page >= totalPages}
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      className="flex size-7 cursor-pointer items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <ArrowRight className="size-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
}
