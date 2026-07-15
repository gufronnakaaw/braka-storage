"use client";

import { FileIcon } from "@/components/drive/file-icon";
import { confirmUpload, requestPresignedUrls, uploadToS3, type ConfirmFileInput } from "@/lib/api/drive";
import { useDragDrop } from "@/lib/hooks";
import { cn, getFileTypeFromExtension } from "@/lib/utils";
import { toastError, toastSuccess } from "@/lib/utils/toast";
import {
  AlertCircle,
  CheckCircle2,
  FileUp,
  Minus,
  Upload,
  X,
} from "lucide-react";
import { forwardRef, useCallback, useImperativeHandle, useRef, useState } from "react";

export interface UploadZoneHandle {
  processFiles: (files: File[]) => void;
}

interface UploadFile {
  id: string;
  file: File;
  name: string;
  size: number;
  progress: number;
  status: "pending" | "presigning" | "uploading" | "done" | "error" | "cancelled";
  key?: string;
  uploadUrl?: string;
  error?: string;
  abort?: () => void;
}

interface UploadZoneProps {
  enabled?: boolean;
  folderId: string | null;
  onUploaded?: () => void;
  ref?: React.Ref<UploadZoneHandle>;
}

export const UploadZone = forwardRef<UploadZoneHandle, UploadZoneProps>(function UploadZone({ enabled = true, folderId, onUploaded }, ref) {
  const [uploads, setUploads] = useState<UploadFile[]>([]);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const uploadsRef = useRef(uploads);
  uploadsRef.current = uploads;

  const updateUpload = useCallback((id: string, patch: Partial<UploadFile>) => {
    setUploads((prev) => prev.map((u) => (u.id === id ? { ...u, ...patch } : u)));
  }, []);

  const processFiles = useCallback(async (files: File[]) => {
    if (!folderId || files.length === 0) return;

    const pending: UploadFile[] = files.map((file) => ({
      id: `upload-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      file,
      name: file.name,
      size: file.size,
      progress: 0,
      status: "pending" as const,
    }));

    setUploads((prev) => [...prev, ...pending]);
    setIsPanelOpen(true);

    const fileInputs = pending.map((f) => ({
      filename: f.name,
      mimeType: f.file.type || "application/octet-stream",
      size: f.file.size,
    }));

    try {
      for (const p of pending) updateUpload(p.id, { status: "presigning" });

      const presigned = await requestPresignedUrls(folderId, fileInputs);

      const confirmedFiles: ConfirmFileInput[] = [];

      for (let i = 0; i < presigned.length; i++) {
        const presign = presigned[i];
        const uploadEntry = pending[i];

        updateUpload(uploadEntry.id, {
          status: "uploading",
          key: presign.key,
          uploadUrl: presign.uploadUrl,
        });

        const { promise, abort } = uploadToS3(
          presign.uploadUrl,
          uploadEntry.file,
          (percent) => updateUpload(uploadEntry.id, { progress: percent }),
        );

        updateUpload(uploadEntry.id, { abort });

        try {
          await promise;
          updateUpload(uploadEntry.id, { status: "done", progress: 100, abort: undefined });
          confirmedFiles.push({
            key: presign.key,
            filename: presign.filename,
            mimeType: presign.mimeType,
            size: presign.size,
          });
        } catch (err) {
          const isCancelled = err instanceof Error && err.message === "Upload cancelled";
          updateUpload(uploadEntry.id, {
            status: isCancelled ? "cancelled" : "error",
            error: isCancelled ? undefined : err instanceof Error ? err.message : "Upload failed",
            abort: undefined,
          });
        }
      }

      if (confirmedFiles.length > 0) {
        await confirmUpload(folderId, confirmedFiles);
        toastSuccess(`${confirmedFiles.length} file${confirmedFiles.length !== 1 ? "s" : ""} uploaded`);
        onUploaded?.();
      }
    } catch (err) {
      toastError(err, "Upload failed");
      for (const p of pending) {
        const current = uploadsRef.current.find((u) => u.id === p.id);
        if (current && (current.status === "pending" || current.status === "presigning")) {
          updateUpload(p.id, {
            status: "error",
            error: err instanceof Error ? err.message : "Failed to get upload URLs",
          });
        }
      }
    }
  }, [folderId, onUploaded, updateUpload]);

  const cancelUpload = useCallback((id: string) => {
    const entry = uploadsRef.current.find((u) => u.id === id);
    if (entry?.abort) entry.abort();
    updateUpload(id, { status: "cancelled", abort: undefined });
  }, [updateUpload]);

  const cancelAll = useCallback(() => {
    for (const u of uploadsRef.current) {
      if (u.status === "pending" || u.status === "presigning" || u.status === "uploading") {
        if (u.abort) u.abort();
        updateUpload(u.id, { status: "cancelled", abort: undefined });
      }
    }
  }, [updateUpload]);

  const clearCompleted = useCallback(() => {
    setUploads((prev) => prev.filter((u) => u.status !== "done" && u.status !== "cancelled"));
  }, []);

  useImperativeHandle(ref, () => ({ processFiles }), [processFiles]);

  const handleFiles = useCallback(
    (fileList: FileList | File[]) => {
      processFiles(Array.from(fileList));
    },
    [processFiles],
  );

  const { isDragOver, dragHandlers } = useDragDrop({ onFiles: handleFiles });

  const activeCount = uploads.filter(
    (u) => u.status === "pending" || u.status === "presigning" || u.status === "uploading",
  ).length;
  const doneCount = uploads.filter((u) => u.status === "done").length;
  const totalCount = uploads.length;

  return (
    <>
      {isDragOver && enabled && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
          {...dragHandlers}
        >
          <div className="flex flex-col items-center gap-4 p-12 rounded-2xl border-2 border-dashed border-primary/50 bg-primary/5 glow-accent">
            <div className="flex items-center justify-center size-16 rounded-2xl bg-primary/10">
              <FileUp className="size-8 text-primary" />
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold text-foreground">Drop files to upload</p>
              <p className="text-sm text-muted-foreground mt-1">Release to start uploading</p>
            </div>
          </div>
        </div>
      )}

      {enabled && !isDragOver && (
        <div
          className="fixed inset-0 z-40 pointer-events-none"
          {...dragHandlers}
        />
      )}

      <input
        ref={inputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files) handleFiles(e.target.files);
          e.target.value = "";
        }}
      />

      {isPanelOpen && totalCount > 0 && (
        <div className="fixed bottom-4 right-4 z-50 w-80 bg-card border border-border rounded-xl shadow-lg overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-card">
            <div className="flex items-center gap-2">
              <Upload className="size-3.5 text-primary" />
              <span className="text-xs font-medium text-foreground">
                {activeCount > 0
                  ? `Uploading ${activeCount} file${activeCount !== 1 ? "s" : ""}`
                  : doneCount === totalCount
                  ? `${totalCount} file${totalCount !== 1 ? "s" : ""} uploaded`
                  : `${totalCount} file${totalCount !== 1 ? "s" : ""}`}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              {activeCount > 0 && (
                <button
                  onClick={cancelAll}
                  className="cursor-pointer text-[10px] text-muted-foreground transition-colors hover:text-destructive"
                >
                  Cancel all
                </button>
              )}
              {activeCount === 0 && doneCount > 0 && (
                <button
                  onClick={clearCompleted}
                  className="cursor-pointer text-[10px] text-primary transition-colors hover:text-primary/80"
                >
                  Clear
                </button>
              )}
              <button
                onClick={() => {
                  if (activeCount > 0) cancelAll();
                  setUploads([]);
                  setIsPanelOpen(false);
                }}
                className="cursor-pointer p-0.5 text-muted-foreground transition-colors hover:text-foreground"
              >
                <X className="size-3.5" />
              </button>
            </div>
          </div>

          <div className="max-h-56 overflow-y-auto">
            {uploads.map((file) => (
              <div
                key={file.id}
                className="flex items-center gap-3 px-4 py-2 border-b border-border/50 last:border-0"
              >
                <FileIcon
                  type={getFileTypeFromExtension(file.name.split(".").pop() ?? "")}
                  size={16}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-foreground truncate">{file.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 h-1 rounded-full bg-secondary overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-300",
                          file.status === "done"
                            ? "bg-emerald-400"
                            : file.status === "error"
                            ? "bg-destructive"
                            : file.status === "cancelled"
                            ? "bg-muted-foreground/40"
                            : "bg-primary",
                        )}
                        style={{ width: `${file.progress}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-muted-foreground shrink-0">
                      {file.status === "done"
                        ? "Done"
                        : file.status === "error"
                        ? file.error || "Failed"
                        : file.status === "cancelled"
                        ? "Cancelled"
                        : file.status === "presigning"
                        ? "Preparing..."
                        : `${Math.round(file.progress)}%`}
                    </span>
                  </div>
                </div>
                {file.status === "done" && (
                  <CheckCircle2 className="size-3.5 text-emerald-400 shrink-0" />
                )}
                {file.status === "error" && (
                  <AlertCircle className="size-3.5 text-destructive shrink-0" />
                )}
                {(file.status === "pending" || file.status === "presigning" || file.status === "uploading") && (
                  <button
                    onClick={() => cancelUpload(file.id)}
                    className="cursor-pointer p-0.5 text-muted-foreground transition-colors hover:text-destructive shrink-0"
                  >
                    <Minus className="size-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={() => inputRef.current?.click()}
        className="hidden"
        id="upload-trigger"
      />
    </>
  );
});
