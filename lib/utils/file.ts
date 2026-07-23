import type { FileType } from "@/lib/types/file";

export function downloadFile(id: string, name: string) {
  const a = document.createElement("a");
  a.href = `/api/drive/download/${id}`;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export type PreviewType = "image" | "video" | "audio" | "pdf" | "code" | null;

export function getPreviewType(mimeType: string): PreviewType {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType.startsWith("audio/")) return "audio";
  if (mimeType === "application/pdf") return "pdf";
  if (mimeType.startsWith("text/")) return "code";
  return null;
}

export function isPreviewable(mimeType: string): boolean {
  return getPreviewType(mimeType) !== null;
}

export function getFileTypeFromMime(mimeType: string): FileType {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType.startsWith("audio/")) return "audio";
  if (mimeType === "application/pdf") return "pdf";
  if (mimeType === "text/csv") return "spreadsheet";
  if (
    mimeType === "application/msword" ||
    mimeType ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    mimeType === "application/rtf"
  )
    return "document";
  if (
    mimeType === "application/vnd.ms-excel" ||
    mimeType ===
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  )
    return "spreadsheet";
  if (
    mimeType === "application/vnd.ms-powerpoint" ||
    mimeType ===
      "application/vnd.openxmlformats-officedocument.presentationml.presentation"
  )
    return "presentation";
  if (mimeType.startsWith("application/zip") || mimeType.includes("tar") || mimeType.includes("compress"))
    return "archive";
  if (
    mimeType.includes("javascript") ||
    mimeType.includes("json") ||
    mimeType.includes("yaml") ||
    mimeType.endsWith("+xml") ||
    mimeType === "text/css" ||
    mimeType === "text/html" ||
    mimeType === "text/markdown" ||
    mimeType === "text/x-python" ||
    mimeType.startsWith("text/x-")
  )
    return "code";
  if (mimeType.startsWith("text/")) return "text";
  return "other";
}

export function getFileTypeFromExtension(ext: string): FileType {
  const map: Record<string, FileType> = {
    png: "image", jpg: "image", jpeg: "image", gif: "image", svg: "image", webp: "image", ico: "image",
    mp4: "video", mov: "video", avi: "video", mkv: "video", webm: "video",
    mp3: "audio", wav: "audio", ogg: "audio", flac: "audio",
    pdf: "pdf",
    doc: "document", docx: "document", rtf: "document",
    xls: "spreadsheet", xlsx: "spreadsheet", csv: "spreadsheet",
    ppt: "presentation", pptx: "presentation",
    js: "code", ts: "code", tsx: "code", jsx: "code", py: "code",
    rb: "code", go: "code", rs: "code", java: "code", cpp: "code",
    c: "code", h: "code", css: "code", html: "code", md: "code",
    json: "code", yaml: "code", yml: "code", toml: "code",
    zip: "archive", rar: "archive", tar: "archive", gz: "archive", "7z": "archive",
    txt: "text", log: "text",
  };
  return map[ext.toLowerCase()] || "other";
}
