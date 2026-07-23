"use client";

import { FileIcon } from "@/components/drive/file-icon";
import type { FileItem } from "@/lib/types";
import { downloadFile, formatFileSize, getPreviewType } from "@/lib/utils";
import type { PreviewType } from "@/lib/utils";
import {
  Download,
  ExternalLink,
  Link,
  Maximize2,
  X,
  Loader2,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

const PREVIEW_BASE = process.env.NEXT_PUBLIC_PREVIEW_URL ?? "";

function getFileUrl(file: FileItem): string {
  if (!file.key || !PREVIEW_BASE) return "";
  return `${PREVIEW_BASE}/${file.key}`;
}

function getPreviewTypeFromFile(file: FileItem): PreviewType {
  if (file.mimeType) return getPreviewType(file.mimeType);
  if (file.extension) {
    const mimeMap: Record<string, string> = {
      png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg",
      gif: "image/gif", svg: "image/svg+xml", webp: "image/webp",
      ico: "image/x-icon",
      mp4: "video/mp4", mov: "video/quicktime",
      avi: "video/x-msvideo", mkv: "video/x-matroska",
      webm: "video/webm",
      mp3: "audio/mpeg", wav: "audio/wav",
      ogg: "audio/ogg", flac: "audio/flac",
      pdf: "application/pdf",
      txt: "text/plain", log: "text/plain",
      js: "text/javascript", ts: "text/typescript",
      tsx: "text/typescript", jsx: "text/javascript",
      py: "text/x-python", rb: "text/x-ruby",
      go: "text/x-go", rs: "text/x-rust",
      java: "text/x-java", cpp: "text/x-c++", c: "text/x-c",
      css: "text/css", html: "text/html", md: "text/markdown",
      json: "application/json", yaml: "text/yaml", yml: "text/yaml",
      xml: "text/xml", toml: "text/toml",
    };
    const mime = mimeMap[file.extension.toLowerCase()];
    if (mime) return getPreviewType(mime);
  }
  return null;
}

interface PreviewModalProps {
  file: FileItem | null;
  onClose: () => void;
  onCopyUrl?: (file: FileItem) => void;
}

function CodePreview({ file }: { file: FileItem }) {
  const [content, setContent] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch(`/api/drive/content/${file.id}`)
      .then((r) => {
        if (!r.ok) throw new Error("Failed to fetch");
        return r.text();
      })
      .then(setContent)
      .catch(() => setError(true));
  }, [file.id]);

  if (error) {
    return (
      <div className="flex items-center justify-center w-full h-full bg-secondary/30">
        <p className="text-xs text-muted-foreground">Failed to load content</p>
      </div>
    );
  }

  if (content === null) {
    return (
      <div className="flex items-center justify-center w-full h-full bg-secondary/30">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <pre className="w-full h-full p-4 overflow-auto whitespace-pre-wrap text-sm font-mono leading-relaxed text-foreground bg-secondary/10">
      <code>{content}</code>
    </pre>
  );
}

function FilePreviewContent({ file }: { file: FileItem }) {
  const previewType = getPreviewTypeFromFile(file);
  const url = getFileUrl(file);

  if (previewType === "image" && url) {
    return (
      <div className="flex items-center justify-center w-full h-full bg-secondary/10 p-4">
        <img
          src={url}
          alt={file.name}
          className="max-w-full max-h-full object-contain rounded-lg"
        />
      </div>
    );
  }

  if (previewType === "video" && url) {
    return (
      <div className="flex items-center justify-center w-full h-full bg-black/5 p-4">
        <video
          src={url}
          controls
          className="max-w-full max-h-full rounded-lg"
        >
          Your browser does not support video playback.
        </video>
      </div>
    );
  }

  if (previewType === "audio" && url) {
    return (
      <div className="flex items-center justify-center w-full h-full bg-secondary/30 p-4">
        <div className="flex flex-col items-center gap-6">
          <div className="size-24 rounded-full bg-primary/10 flex items-center justify-center">
            <FileIcon type="audio" size={40} />
          </div>
          <audio
            src={url}
            controls
            className="w-full max-w-md"
          >
            Your browser does not support audio playback.
          </audio>
        </div>
      </div>
    );
  }

  if (previewType === "pdf" && url) {
    return (
      <div className="w-full h-full">
        <iframe
          src={url}
          className="w-full h-full border-0"
          title={file.name}
        />
      </div>
    );
  }

  if (previewType === "code") {
    return <CodePreview file={file} />;
  }

  return (
    <div className="flex items-center justify-center w-full h-full bg-secondary/30">
      <div className="flex flex-col items-center gap-4">
        <FileIcon type={file.type} size={64} />
        <div className="text-center">
          <p className="text-sm text-foreground font-medium">{file.name}</p>
          <p className="text-xs text-muted-foreground mt-1">
            Preview not available for this file type
          </p>
        </div>
      </div>
    </div>
  );
}



export function PreviewModal({ file, onClose, onCopyUrl }: PreviewModalProps) {
  const [isMaximized, setIsMaximized] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const onDownload = useCallback(async () => {
    if (!file) return;
    setIsDownloading(true);
    try {
      downloadFile(file.id, file.name);
    } finally {
      setIsDownloading(false);
    }
  }, [file]);

  const onExternalLink = useCallback(() => {
    if (!file) return;
    const url = getFileUrl(file);
    if (url) window.open(url, "_blank");
  }, [file]);

  const onMaximize = useCallback(() => {
    if (!file) return;
    const previewType = getPreviewTypeFromFile(file);
    if (previewType !== "image") return;
    setIsMaximized((prev) => !prev);
  }, [file]);

  if (!file) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex cursor-pointer items-center justify-center bg-background/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className={`relative flex cursor-default flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl ${
          isMaximized ? "h-[95vh] w-[95vw] max-w-none" : "h-[85vh] w-full max-w-4xl"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between h-12 px-4 border-b border-border bg-card">
          <div className="flex items-center gap-2.5 min-w-0">
            <FileIcon type={file.type} size={16} />
            <span className="text-sm font-medium text-foreground truncate">
              {file.name}
            </span>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
              {file.extension}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={onDownload}
              disabled={isDownloading}
              className="flex size-7 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-50"
              title="Download"
            >
              <Download className="size-3.5" />
            </button>
            <button
              onClick={() => onCopyUrl?.(file)}
              className="flex size-7 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              title="Copy URL"
            >
              <Link className="size-3.5" />
            </button>
            <button
              onClick={onExternalLink}
              className="flex size-7 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              title="Open in new tab"
            >
              <ExternalLink className="size-3.5" />
            </button>
            {getPreviewTypeFromFile(file) === "image" && (
              <button
                onClick={onMaximize}
                className="flex size-7 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                title="View full size"
              >
                <Maximize2 className="size-3.5" />
              </button>
            )}
            <div className="w-px h-4 bg-border mx-1" />
            <button
              onClick={onClose}
              className="flex size-7 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              <X className="size-3.5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-hidden">
          <FilePreviewContent file={file} />
        </div>

        <div className="flex items-center justify-between h-10 px-4 border-t border-border bg-card text-[11px] text-muted-foreground">
          <div className="flex items-center gap-4">
            <span>
              {file.size ? formatFileSize(file.size) : "—"}
            </span>
            <span>Modified {new Date(file.modifiedAt).toLocaleDateString()}</span>
            <span>Created {new Date(file.createdAt).toLocaleDateString()}</span>
          </div>
          <span className="capitalize">{file.type}</span>
        </div>
      </div>
    </div>
  );
}
