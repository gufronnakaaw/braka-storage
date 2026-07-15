"use client";

import { FileIcon } from "@/components/drive/file-icon";
import type { FileItem } from "@/lib/types";
import { downloadFile, formatFileSize } from "@/lib/utils";
import {
  Download,
  ExternalLink,
  Link,
  Maximize2,
  X
} from "lucide-react";
import { useCallback, useState } from "react";

const PREVIEW_BASE = process.env.NEXT_PUBLIC_PREVIEW_URL ?? "";

function getFileUrl(file: FileItem): string {
  if (!file.key || !PREVIEW_BASE) return "";
  return `${PREVIEW_BASE}/${file.key}`;
}

const IMAGE_EXTENSIONS = new Set(["png", "jpg", "jpeg", "gif", "svg", "webp", "ico"]);

function isImageFile(file: FileItem): boolean {
  return IMAGE_EXTENSIONS.has(file.extension?.toLowerCase() ?? "");
}

interface PreviewModalProps {
  file: FileItem | null;
  onClose: () => void;
  onCopyUrl?: (file: FileItem) => void;
}

function FilePreviewContent({ file }: { file: FileItem }) {
  const url = getFileUrl(file);

  if (isImageFile(file) && url) {
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
    if (!file || !isImageFile(file)) return;
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
            {isImageFile(file) && (
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
