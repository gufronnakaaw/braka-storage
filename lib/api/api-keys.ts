export type ApiKeyRecord = {
  id: string;
  name: string;
  prefix: string;
  last4: string;
  created_at: string;
  expires_at: string | null;
  last_used_at: string | null;
  status: "ACTIVE" | "REVOKED";
};

export type ExpiryOption = "never" | "1_week" | "2_weeks" | "1_month" | "3_months";

export const EXPIRY_LABELS: Record<ExpiryOption, string> = {
  never: "No expiry",
  "1_week": "1 week",
  "2_weeks": "2 weeks",
  "1_month": "1 month",
  "3_months": "3 months",
};

import { parseApiResponse } from "./errors";

export async function fetchApiKeys(): Promise<ApiKeyRecord[]> {
  const res = await fetch("/api/api-keys", { cache: "no-store" });
  return parseApiResponse<ApiKeyRecord[]>(res);
}

export async function createApiKey(
  name: string,
  expiry: ExpiryOption,
): Promise<{ plainTextKey: string }> {
  const res = await fetch("/api/api-keys", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, expiry }),
  });
  return parseApiResponse<{ plainTextKey: string }>(res);
}

export async function revokeApiKey(id: string): Promise<void> {
  const res = await fetch(`/api/api-keys/${id}`, { method: "DELETE" });
  await parseApiResponse<unknown>(res);
}
