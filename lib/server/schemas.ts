import { z } from "zod";
import { ValidationError } from "./errors";

export const CreateFolderSchema = z.object({
  name: z.string().trim().min(1, "Folder name is required").max(255),
  parentId: z.string().nullable().default(null),
});

export const RenameSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(255),
});

export const FolderIdParamSchema = z.object({
  id: z.string().min(1, "ID is required"),
});

export const BreadcrumbsQuerySchema = z.object({
  folderId: z.string().nullable().default(null),
});

export const FolderPathQuerySchema = z.object({
  folderId: z.string().min(1, "folderId is required"),
});

export const ItemsQuerySchema = z.object({
  parentId: z.string().nullable().default(null),
});

export const ResolveQuerySchema = z.object({
  slug: z.array(z.string().min(1)).default([]),
});

export const SearchQuerySchema = z.object({
  q: z.string().default(""),
});

export const LogsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  timeFilter: z.enum(["5m", "30m", "1h", "6h", "12h", "1d"]).default("1d"),
});

const MAX_FILE_SIZE = 500 * 1024 * 1024;

export const PresignFileSchema = z.object({
  filename: z.string().trim().min(1, "Filename is required").max(255),
  mimeType: z.string().min(1, "MIME type is required"),
  size: z.number().int().positive().max(MAX_FILE_SIZE, `File size must be under ${MAX_FILE_SIZE / 1024 / 1024}MB`),
});

export const PresignUploadSchema = z.object({
  folderId: z.string().min(1, "folderId is required"),
  files: z.array(PresignFileSchema).min(1, "At least one file is required").max(20, "Maximum 20 files per upload"),
});

export const ConfirmUploadSchema = z.object({
  fileIds: z.array(z.string().min(1)).min(1, "At least one file ID is required"),
});

export const ApiKeyIdParamSchema = z.object({
  id: z.string().min(1, "ID is required"),
});

export function zodFieldErrors(error: z.ZodError): Record<string, string[]> {
  const fieldErrors: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = issue.path.length > 0 ? issue.path.join(".") : "_root";
    (fieldErrors[key] ??= []).push(issue.message);
  }
  return fieldErrors;
}

export async function parseBody<T extends z.ZodTypeAny>(
  req: Request,
  schema: T,
): Promise<z.infer<T>> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    throw new ValidationError("Invalid JSON body");
  }
  const result = schema.safeParse(body);
  if (!result.success) {
    throw new ValidationError("Invalid input", zodFieldErrors(result.error));
  }
  return result.data;
}

export function parseQuery<T extends z.ZodTypeAny>(
  schema: T,
  params: Record<string, string | string[] | null>,
): z.infer<T> {
  const cleaned: Record<string, string | string[]> = {};
  for (const [key, value] of Object.entries(params)) {
    if (value !== null && value !== undefined) {
      cleaned[key] = value;
    }
  }
  const result = schema.safeParse(cleaned);
  if (!result.success) {
    throw new ValidationError(
      "Invalid input",
      zodFieldErrors(result.error),
    );
  }
  return result.data;
}
