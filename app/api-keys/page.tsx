"use client";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { PageHeader } from "@/components/layout/page-header";
import { RefreshButton } from "@/components/ui/refresh-button";
import { CustomSelect } from "@/components/ui/select";
import {
  EXPIRY_LABELS,
  type ExpiryOption,
} from "@/lib/api/api-keys";
import {
  useApiKeys,
  useCreateApiKey,
  useRevokeApiKey,
} from "@/lib/hooks";
import { cn } from "@/lib/utils";
import { toastError, toastSuccess } from "@/lib/utils/toast";
import { Check, Copy, Eye, KeyRound, ShieldCheck, Trash2, X } from "lucide-react";
import { useMemo, useState } from "react";

export default function ApiKeysPage() {
  const [newName, setNewName] = useState("");
  const [newExpiry, setNewExpiry] = useState<ExpiryOption>("never");
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [copied, setCopied] = useState(false);

  const { data: keys, isLoading, error: swrError, mutate } = useApiKeys();
  const { trigger: createKey, isMutating: isCreating } = useCreateApiKey();
  const { trigger: revokeKey } = useRevokeApiKey();

  async function handleCreate() {
    if (!newName.trim() || isCreating) return;
    try {
      const { plainTextKey } = await createKey({ name: newName, expiry: newExpiry });
      toastSuccess("API key created");
      setCreatedKey(plainTextKey);
      setShowKeyModal(true);
      setNewName("");
      setNewExpiry("never");
    } catch (err) {
      toastError(err, "Failed to create API key");
    }
  }

  async function handleRevoke(id: string) {
    try {
      await revokeKey(id);
      toastSuccess("API key revoked");
    } catch (err) {
      toastError(err, "Failed to revoke API key");
    }
  }

  function handleCopyKey() {
    if (createdKey) {
      navigator.clipboard.writeText(createdKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  const activeCount = useMemo(
    () => (keys ?? []).filter((item) => item.status === "ACTIVE").length,
    [keys],
  );

  return (
    <DashboardLayout
      activeView="apiKeys"
      mobileTitle="API Keys"
      mobileSubtitle="Security"
    >
      <PageHeader label="Security" title="API Keys" />

      <div className="space-y-3 p-3 sm:space-y-4 sm:p-6">
        <section className="rounded-xl border border-border bg-card/60 p-3 sm:p-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground sm:text-xs">Create Key</p>
              <p className="mt-1 text-xs text-foreground sm:text-sm">Active keys: {activeCount}</p>
            </div>
            <RefreshButton onClick={() => mutate()} />
          </div>

          <div className="mt-3 flex flex-col gap-2 sm:mt-4 sm:flex-row">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Key name"
              className="h-11 w-full flex-1 rounded-lg border border-input bg-background px-4 text-sm text-foreground outline-none ring-0 transition-colors focus:border-primary/50 sm:h-9 sm:w-auto sm:px-3"
            />
            <CustomSelect
              value={newExpiry}
              onChange={(val) => setNewExpiry(val as ExpiryOption)}
              options={(Object.entries(EXPIRY_LABELS) as [ExpiryOption, string][]).map(
                ([value, label]) => ({ value, label }),
              )}
              className="w-full sm:w-40"
            />
            <button
              type="button"
              onClick={() => void handleCreate()}
              disabled={isCreating}
              className="flex h-9 cursor-pointer items-center justify-center gap-2 rounded-lg bg-primary px-4 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <KeyRound className="size-3.5" />
              {isCreating ? "Creating..." : "Create API Key"}
            </button>
          </div>

          {swrError && <p className="mt-3 text-xs text-destructive">{(swrError as Error)?.message ?? "Failed to load API keys"}</p>}
        </section>

        <section className="rounded-xl border border-border bg-card/60 p-3 sm:p-4">
          <p className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground sm:text-xs">Managed Keys</p>

          {isLoading ? (
            <p className="mt-3 text-sm text-muted-foreground">Loading API keys...</p>
          ) : (keys ?? []).length === 0 ? (
            <p className="mt-3 text-center text-sm text-muted-foreground">Belum ada API key.</p>
          ) : (
            <>
              <div className="mt-3 hidden overflow-hidden rounded-lg border border-border/80 bg-background/60 md:block">
                <table className="min-w-full text-left text-xs">
                  <thead className="border-b border-border bg-card/80">
                    <tr className="text-muted-foreground">
                      <th className="px-3 py-2 font-medium">Name</th>
                      <th className="px-3 py-2 font-medium">Key</th>
                      <th className="px-3 py-2 font-medium">Status</th>
                      <th className="px-3 py-2 font-medium">Created</th>
                      <th className="px-3 py-2 font-medium">Expires</th>
                      <th className="px-3 py-2 font-medium">Last Used</th>
                      <th className="px-3 py-2 text-right font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(keys ?? []).map((key) => (
                      <tr key={key.id} className="border-b border-border/70 last:border-b-0">
                        <td className="px-3 py-2.5 text-sm font-medium text-foreground">
                          <p className="max-w-40 truncate">{key.name}</p>
                        </td>
                        <td className="px-3 py-2.5 font-mono text-muted-foreground">
                          {key.prefix}...{key.last4}
                        </td>
                        <td className="px-3 py-2.5">
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] uppercase tracking-[0.08em]",
                              key.status === "ACTIVE"
                                ? "bg-emerald-500/10 text-emerald-400"
                                : "bg-muted text-muted-foreground",
                            )}
                          >
                            <ShieldCheck className="size-3" />
                            {key.status}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-muted-foreground">
                          {new Date(key.created_at).toLocaleDateString("id-ID")}
                        </td>
                        <td className="px-3 py-2.5 text-muted-foreground">
                          {key.expires_at
                            ? new Date(key.expires_at).toLocaleDateString("id-ID")
                            : "Never"}
                        </td>
                        <td className="px-3 py-2.5 text-muted-foreground">
                          {key.last_used_at
                            ? new Date(key.last_used_at).toLocaleDateString("id-ID")
                            : "-"}
                        </td>
                        <td className="px-3 py-2.5 text-right">
                          <button
                            type="button"
                            onClick={() => void handleRevoke(key.id)}
                            disabled={key.status === "REVOKED"}
                            className="inline-flex h-8 cursor-pointer items-center gap-1 rounded-md border border-border px-2.5 text-[11px] text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <Trash2 className="size-3" />
                            Revoke
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-3 space-y-2 md:hidden">
                {(keys ?? []).map((key) => (
                  <div key={key.id} className="rounded-lg border border-border/80 bg-background/60 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">{key.name}</p>
                        <p className="mt-0.5 font-mono text-xs text-muted-foreground">{key.prefix}...{key.last4}</p>
                      </div>
                      <span
                        className={cn(
                          "inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-1 text-[10px] uppercase tracking-[0.08em]",
                          key.status === "ACTIVE"
                            ? "bg-emerald-500/10 text-emerald-400"
                            : "bg-muted text-muted-foreground",
                        )}
                      >
                        <ShieldCheck className="size-3" />
                        {key.status}
                      </span>
                    </div>
                    <div className="mt-2.5 grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      <div>
                        <span className="text-[10px] uppercase">Created</span>
                        <p>{new Date(key.created_at).toLocaleDateString("id-ID")}</p>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase">Expires</span>
                        <p>{key.expires_at ? new Date(key.expires_at).toLocaleDateString("id-ID") : "Never"}</p>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase">Last Used</span>
                        <p>{key.last_used_at ? new Date(key.last_used_at).toLocaleDateString("id-ID") : "-"}</p>
                      </div>
                    </div>
                    <div className="mt-3 flex justify-end">
                      <button
                        type="button"
                        onClick={() => void handleRevoke(key.id)}
                        disabled={key.status === "REVOKED"}
                        className="inline-flex h-8 cursor-pointer items-center gap-1 rounded-md border border-border px-2.5 text-[11px] text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Trash2 className="size-3" />
                        Revoke
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>
      </div>

      {showKeyModal && createdKey && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm"
          onClick={() => setShowKeyModal(false)}
        >
          <div
            className="relative w-full max-w-lg rounded-2xl border border-border bg-card p-4 shadow-2xl sm:p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setShowKeyModal(false)}
              className="absolute right-4 top-4 flex size-7 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              <X className="size-4" />
            </button>

            <div className="flex flex-col items-center text-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-primary/10">
                <KeyRound className="size-6 text-primary" />
              </div>
              <h2 className="mt-4 text-lg font-semibold text-foreground">API Key Created</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Copy this key now. You won&apos;t be able to see it again.
              </p>
            </div>

            <div className="mt-5 flex items-center gap-2 rounded-lg border border-border bg-background p-3">
              <Eye className="size-4 shrink-0 text-muted-foreground" />
              <code className="flex-1 break-all font-mono text-xs text-foreground">{createdKey}</code>
              <button
                type="button"
                onClick={handleCopyKey}
                className="flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              >
                {copied ? <Check className="size-3.5 text-emerald-500" /> : <Copy className="size-3.5" />}
              </button>
            </div>

            <button
              type="button"
              onClick={() => setShowKeyModal(false)}
              className="mt-5 flex h-9 w-full cursor-pointer items-center justify-center rounded-lg bg-primary text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
