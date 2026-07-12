"use client";

import { FileIcon } from "@/components/drive/file-icon";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useDragDrop } from "@/lib/hooks";
import { cn, formatFileSize, getFileTypeFromExtension } from "@/lib/utils";
import { FileUp, Plus, X } from "lucide-react";
import { useCallback, useRef, useState } from "react";

interface UploadModalProps {
  open: boolean;
  onClose: () => void;
  onUpload: (files: File[]) => void;
}

export function UploadModal({ open, onClose, onUpload }: UploadModalProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback((newFiles: FileList | File[]) => {
    const arr = Array.from(newFiles);
    setSelectedFiles((prev) => [...prev, ...arr]);
  }, []);

  const removeFile = useCallback((index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleUpload = useCallback(() => {
    if (selectedFiles.length === 0) return;
    onUpload(selectedFiles);
    setSelectedFiles([]);
    onClose();
  }, [selectedFiles, onUpload, onClose]);

  const { isDragOver, dragHandlers } = useDragDrop({ onFiles: addFiles });

  function handleClose() {
    setSelectedFiles([]);
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
      <DialogContent className="sm:max-w-lg" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle className="text-base">Upload Files</DialogTitle>
          <DialogDescription>
            Drag and drop or browse to select files
          </DialogDescription>
        </DialogHeader>

        <div
          {...dragHandlers}
          onClick={() => inputRef.current?.click()}
          className={cn(
            "flex flex-col items-center gap-3 rounded-xl border-2 border-dashed p-8 transition-colors cursor-pointer",
            isDragOver
              ? "border-primary/60 bg-primary/5"
              : "border-border hover:border-primary/30 hover:bg-secondary/30",
          )}
        >
          <div className={cn(
            "flex items-center justify-center size-12 rounded-xl transition-colors",
            isDragOver ? "bg-primary/10" : "bg-secondary/50",
          )}>
            <FileUp className={cn("size-6", isDragOver ? "text-primary" : "text-muted-foreground")} />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-foreground">
              {isDragOver ? "Drop files here" : "Drag & drop files here"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              or click to browse
            </p>
          </div>
        </div>

        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files) addFiles(e.target.files);
            e.target.value = "";
          }}
        />

        {selectedFiles.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">
              {selectedFiles.length} file{selectedFiles.length !== 1 ? "s" : ""} selected
            </p>
            <div className="max-h-40 overflow-y-auto space-y-1 rounded-lg border border-border bg-background/50 p-1.5">
              {selectedFiles.map((file, i) => (
                <div
                  key={`${file.name}-${i}`}
                  className="flex items-center gap-2.5 rounded-md px-2 py-1.5 hover:bg-secondary/50"
                >
                  <FileIcon
                    type={getFileTypeFromExtension(file.name.split(".").pop() ?? "")}
                    size={14}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-foreground break-all">{file.name}</p>
                  </div>
                  <span className="text-[10px] text-muted-foreground shrink-0">
                    {formatFileSize(file.size)}
                  </span>
                  <button
                    onClick={(e) => { e.stopPropagation(); removeFile(i); }}
                    className="cursor-pointer p-0.5 text-muted-foreground hover:text-destructive shrink-0"
                  >
                    <X className="size-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center justify-end gap-2 pt-1">
          <Button variant="ghost" size="sm" onClick={handleClose} 
            className="cursor-pointer">
            Cancel
          </Button>
          <Button
            size="sm"
            disabled={selectedFiles.length === 0}
            onClick={handleUpload}
            className="gap-1.5 cursor-pointer"
          >
            <Plus className="size-3.5" />
            Upload {selectedFiles.length > 0 && `(${selectedFiles.length})`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
