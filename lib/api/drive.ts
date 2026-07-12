import type { FileItem, FolderBreadcrumb } from "@/lib/types";
import { parseApiResponse } from "./errors";

const BASE = "/api/drive";

async function apiFetch<T>(url: string): Promise<T> {
  const res = await fetch(url);
  return parseApiResponse<T>(res);
}

export async function fetchItems(parentId: string | null): Promise<FileItem[]> {
  const params = parentId ? `?parentId=${encodeURIComponent(parentId)}` : "";
  return apiFetch<FileItem[]>(`${BASE}/items${params}`);
}

export async function fetchItemById(id: string): Promise<FileItem> {
  return apiFetch<FileItem>(`${BASE}/folders/${encodeURIComponent(id)}`);
}

export async function createFolderApi(
  name: string,
  parentId: string | null
): Promise<FileItem> {
  const res = await fetch(`${BASE}/folders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, parentId }),
  });
  return parseApiResponse<FileItem>(res);
}

export async function fetchBreadcrumbs(
  folderId: string | null
): Promise<FolderBreadcrumb[]> {
  const params = folderId
    ? `?folderId=${encodeURIComponent(folderId)}`
    : "";
  return apiFetch<FolderBreadcrumb[]>(`${BASE}/breadcrumbs${params}`);
}

export async function fetchFolderPath(folderId: string): Promise<string[]> {
  return apiFetch<string[]>(
    `${BASE}/folder-path?folderId=${encodeURIComponent(folderId)}`
  );
}

export async function fetchSearchFiles(query: string): Promise<FileItem[]> {
  return apiFetch<FileItem[]>(
    `${BASE}/search?q=${encodeURIComponent(query)}`
  );
}

export async function fetchResolveSlug(slug: string[]): Promise<string | null> {
  const params = slug.map((s) => `slug=${encodeURIComponent(s)}`).join("&");
  return apiFetch<string | null>(`${BASE}/resolve?${params}`);
}

interface PresignFileInput {
  filename: string;
  mimeType: string;
  size: number;
}

interface PresignedFile {
  fileId: string;
  filename: string;
  key: string;
  uploadUrl: string;
  mimeType: string;
  size: number;
}

export async function requestPresignedUrls(
  folderId: string,
  files: PresignFileInput[],
): Promise<PresignedFile[]> {
  const res = await fetch(`${BASE}/upload/presign`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ folderId, files }),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error?.message ?? "Failed to get presigned URLs");
  return json.data as PresignedFile[];
}

export async function confirmUpload(fileIds: string[]): Promise<void> {
  const res = await fetch(`${BASE}/upload/confirm`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fileIds }),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error?.message ?? "Failed to confirm upload");
}

export function uploadToS3(
  presignedUrl: string,
  file: File,
  onProgress?: (percent: number) => void,
): { promise: Promise<void>; abort: () => void } {
  const controller = new AbortController();

  const promise = new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", presignedUrl, true);
    xhr.setRequestHeader("Content-Type", file.type);

    controller.signal.addEventListener("abort", () => xhr.abort());

    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    });

    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(new Error(`Upload failed with status ${xhr.status}`));
      }
    });

    xhr.addEventListener("error", () => reject(new Error("Upload failed")));
    xhr.addEventListener("abort", () => reject(new Error("Upload cancelled")));

    xhr.send(file);
  });

  return {
    promise,
    abort: () => controller.abort(),
  };
}
