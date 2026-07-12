import type { LogEntry, PaginatedLogs, TimeFilter } from "@/lib/types";
import { TIME_FILTERS } from "@/lib/types";

export type { LogEntry, PaginatedLogs, TimeFilter };

  export { TIME_FILTERS };

    import { parseApiResponse } from "./errors";

export async function fetchLogs(
  page: number,
  timeFilter: TimeFilter,
): Promise<PaginatedLogs> {
  const res = await fetch(
    `/api/logs?page=${page}&timeFilter=${timeFilter}`,
    { cache: "no-store" },
  );
  return parseApiResponse<PaginatedLogs>(res);
}
