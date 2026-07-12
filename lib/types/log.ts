export type TimeFilter = "5m" | "30m" | "1h" | "6h" | "12h" | "1d";

export const TIME_FILTER_MS: Record<TimeFilter, number> = {
  "5m": 5 * 60 * 1000,
  "30m": 30 * 60 * 1000,
  "1h": 60 * 60 * 1000,
  "6h": 6 * 60 * 60 * 1000,
  "12h": 12 * 60 * 60 * 1000,
  "1d": 24 * 60 * 60 * 1000,
};

export const TIME_FILTERS: { value: TimeFilter; label: string }[] = [
  { value: "5m", label: "Last 5 minutes" },
  { value: "30m", label: "Last 30 minutes" },
  { value: "1h", label: "Last 1 hour" },
  { value: "6h", label: "Last 6 hours" },
  { value: "12h", label: "Last 12 hours" },
  { value: "1d", label: "Last 1 day" },
];

export interface LogEntry {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  entity_name: string | null;
  description: string;
  ip_address: string | null;
  old_value: string | null;
  new_value: string | null;
  performed_by: string;
  created_at: string;
}

export interface PaginatedLogs {
  data: LogEntry[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
