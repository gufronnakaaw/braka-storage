"use client";

import type { ApiKeyRecord, ExpiryOption } from "@/lib/api/api-keys";
import { parseApiResponse } from "@/lib/api/errors";
import { fetcher } from "@/lib/fetcher";
import useSWR, { mutate } from "swr";
import useSWRMutation from "swr/mutation";

const API_KEYS_KEY = "/api/api-keys";

export function useApiKeys() {
  return useSWR<ApiKeyRecord[]>(API_KEYS_KEY, fetcher);
}

export function useCreateApiKey() {
  return useSWRMutation(
    "create-api-key",
    async (
      _key: string,
      { arg }: { arg: { name: string; expiry: ExpiryOption } },
    ) => {
      const res = await fetch(API_KEYS_KEY, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(arg),
      });
      const result = await parseApiResponse<{ plainTextKey: string }>(res);
      void mutate(API_KEYS_KEY);
      return result;
    },
  );
}

export function useRevokeApiKey() {
  return useSWRMutation(
    "revoke-api-key",
    async (_key: string, { arg }: { arg: string }) => {
      const res = await fetch(`${API_KEYS_KEY}/${arg}`, { method: "DELETE" });
      await parseApiResponse<unknown>(res);
      void mutate(API_KEYS_KEY);
    },
  );
}
