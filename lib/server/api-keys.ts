import prisma from "@/lib/server/prisma";
import { z } from "zod";
import { auth } from "../auth";
import { logActivity } from "./activity-log";

const EXPIRY_MS = {
  "1_week": 7 * 24 * 60 * 60 * 1000,
  "2_weeks": 14 * 24 * 60 * 60 * 1000,
  "1_month": 30 * 24 * 60 * 60 * 1000,
  "3_months": 90 * 24 * 60 * 60 * 1000,
} as const;

export const CreateApiKeySchema = z.object({
  name: z.string().min(1, "Key name is required").max(100),
  expiry: z.enum(["never", "1_week", "2_weeks", "1_month", "3_months"]).default("never"),
});

export type CreateApiKeyInput = z.infer<typeof CreateApiKeySchema>;

function generateSecret(): string {
  const randomPart = crypto.randomUUID().replace(/-/g, "");
  return `braka_storage_${randomPart}`;
}

function computeExpiresAt(expiry: z.infer<typeof CreateApiKeySchema>["expiry"]): Date | null {
  if (expiry === "never") return null;
  return new Date(Date.now() + EXPIRY_MS[expiry]);
}

export async function listApiKeys() {
  const keys = await prisma.apiKey.findMany({
    orderBy: { created_at: "desc" },
  });

  return keys.map((key) => ({
    id: key.id,
    name: key.name,
    prefix: key.prefix,
    last4: key.last4,
    status: key.status,
    created_at: key.created_at.toISOString(),
    expires_at: key.expires_at?.toISOString() ?? null,
    last_used_at: key.last_used_at?.toISOString() ?? null,
  }));
}

export async function createApiKey(input: CreateApiKeyInput) {
  const data = CreateApiKeySchema.parse(input);
  const secret = generateSecret();
  const session = await auth()

  const key = await prisma.apiKey.create({
    data: {
      name: data.name,
      prefix: secret.slice(0, 10),
      last4: secret.slice(-4),
      secret,
      expires_at: computeExpiresAt(data.expiry),
    },
  });

  await logActivity({
    action: "API_KEY_CREATE",
    entityType: "API_KEY",
    entityId: key.id,
    entityName: key.name,
    description: `Created API key "${key.name}"`,
    performedBy: session?.user?.name || "system",
  });

  return {
    record: {
      id: key.id,
      name: key.name,
      prefix: key.prefix,
      last4: key.last4,
      status: key.status,
      created_at: key.created_at.toISOString(),
      expires_at: key.expires_at?.toISOString() ?? null,
      last_used_at: key.last_used_at?.toISOString() ?? null,
    },
    plainTextKey: secret,
  };
}

export async function revokeApiKey(id: string) {
  const existing = await prisma.apiKey.findUnique({ where: { id } });
  if (!existing) return false;

  await prisma.apiKey.update({
    where: { id },
    data: { status: "REVOKED" },
  });

  await logActivity({
    action: "API_KEY_REVOKE",
    entityType: "API_KEY",
    entityId: existing.id,
    entityName: existing.name,
    description: `Revoked API key "${existing.name}"`,
    performedBy: "system",
  });

  return true;
}
