"use client";

import { CreateFolderModal } from "@/components/drive/create-folder-modal";
import { FileBrowser } from "@/components/drive/file-browser";
import { PreviewModal } from "@/components/drive/preview-modal";
import { RenameModal } from "@/components/drive/rename-modal";
import { UploadModal } from "@/components/drive/upload-modal";
import { UploadZone, type UploadZoneHandle } from "@/components/drive/upload-zone";
import { Breadcrumb } from "@/components/layout/breadcrumb";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Topbar } from "@/components/layout/topbar";
import { FileGridSkeleton, FileListSkeleton } from "@/components/ui/loading-skeleton";
import {
  createFolderApi,
  fetchBreadcrumbs,
  fetchFolderPath,
  fetchItemById,
  fetchItems,
  fetchResolveSlug,
  fetchSearchFiles,
} from "@/lib/api/drive";
import { useDriveViewMode } from "@/lib/hooks";
import type { FileItem, FolderBreadcrumb } from "@/lib/types";
import { downloadFile } from "@/lib/utils";
import { toastError, toastSuccess } from "@/lib/utils/toast";
import { FolderPlus, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { use, useCallback, useEffect, useRef, useState } from "react";

export default function FolderPage({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = use(params);
  const router = useRouter();
  const uploadRef = useRef<UploadZoneHandle>(null);

  const { viewMode, setViewMode, hydrated } = useDriveViewMode();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "modifiedAt" | "size" | "type">("name");
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [displayFiles, setDisplayFiles] = useState<FileItem[]>([]);
  const [breadcrumbs, setBreadcrumbs] = useState<FolderBreadcrumb[]>([]);
  const [folder, setFolder] = useState<FileItem | undefined>(undefined);
  const [folderId, setFolderId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [renamingFile, setRenamingFile] = useState<FileItem | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const resolvedId = await fetchResolveSlug(slug);
      setFolderId(resolvedId);

      if (!resolvedId) {
        setNotFound(true);
        return;
      }

      const folderData = await fetchItemById(resolvedId);
      if (!folderData || folderData.type !== "folder") {
        setNotFound(true);
        return;
      }

      setFolder(folderData);
      setNotFound(false);

      if (searchQuery) {
        setDisplayFiles(await fetchSearchFiles(searchQuery));
      } else {
        setDisplayFiles(await fetchItems(resolvedId));
      }
      setBreadcrumbs(await fetchBreadcrumbs(resolvedId));
    } catch (err) {
      console.error("Failed to load data:", err);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }, [slug, searchQuery]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleFolderOpen(subFolderId: string) {
    const subPath = await fetchFolderPath(subFolderId);
    router.push(`/${subPath.join("/")}`);
  }



  async function handleDelete(file: FileItem) {
    const endpoint = file.type === "folder"
      ? `/api/drive/folders/${file.id}`
      : `/api/drive/files/${file.id}`;
    const res = await fetch(endpoint, { method: "DELETE" });
    if (res.ok) await loadData();
  }

  if (!loading && notFound) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-lg font-semibold text-foreground">Folder not found</p>
          <p className="text-sm text-muted-foreground mt-1">
            The folder you&apos;re looking for doesn&apos;t exist.
          </p>
          <button
            onClick={() => router.push("/")}
            className="mt-4 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity cursor-pointer"
          >
            Back to Drive
          </button>
        </div>
      </div>
    );
  }

  if (!folder && !loading) return null;

  return (
    <DashboardLayout activeView="drive" mobileTitle={folder?.name}>
      <div className="hidden md:block">
        <Topbar
          title={folder?.name ?? ""}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />
      </div>

      <Breadcrumb
        items={breadcrumbs}
        onNavigate={async (id) => {
          if (id === null) {
            router.push("/");
          } else {
            try {
              const breadcrumbPath = await fetchFolderPath(id);
              router.push(`/${breadcrumbPath.join("/")}`);
            } catch (err) {
              toastError(err);
            }
          }
        }}
      />

      <div className="flex items-center justify-between px-5 py-2 border-b border-border/50">
        <p className="text-xs text-muted-foreground">
          {displayFiles.length} item{displayFiles.length !== 1 ? "s" : ""}
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCreateFolder(true)}
            className="flex h-7 cursor-pointer items-center gap-1.5 rounded-lg bg-secondary px-3 text-xs text-muted-foreground transition-colors hover:bg-secondary/80 hover:text-foreground"
          >
            <FolderPlus className="size-3" />
            New Folder
          </button>
          <button
            onClick={() => setShowUploadModal(true)}
            className="flex h-7 cursor-pointer items-center gap-1.5 rounded-lg bg-secondary px-3 text-xs text-muted-foreground transition-colors hover:bg-secondary/80 hover:text-foreground"
          >
            <Upload className="size-3" />
            Upload
          </button>
        </div>
      </div>

      {!hydrated || loading ? (
        viewMode === "grid" ? <FileGridSkeleton /> : <FileListSkeleton />
      ) : (
        <FileBrowser
          files={displayFiles}
          viewMode={viewMode}
          onFolderOpen={handleFolderOpen}
          onFilePreview={setPreviewFile}
          onDownload={(file) => downloadFile(file.id, file.name)}
          onRename={(file) => setRenamingFile(file)}
          onDelete={handleDelete}
          sortBy={sortBy}
          onSortChange={setSortBy}
        />
      )}

      <UploadZone ref={uploadRef} enabled folderId={folderId} onUploaded={loadData} />

      <UploadModal
        open={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onUpload={(files) => uploadRef.current?.processFiles(files)}
      />

      <CreateFolderModal
        open={showCreateFolder}
        onClose={() => setShowCreateFolder(false)}
        onCreate={async (name) => {
          try {
            await createFolderApi(name, folderId);
            toastSuccess("Folder created");
            await loadData();
          } catch (err) {
            toastError(err, "Failed to create folder");
          }
        }}
      />

      <PreviewModal file={previewFile} onClose={() => setPreviewFile(null)} />
      <RenameModal
        open={!!renamingFile}
        currentName={renamingFile?.name ?? ""}
        onClose={() => setRenamingFile(null)}
        onRename={async (newName) => {
          if (!renamingFile) return;
          try {
            const endpoint = renamingFile.type === "folder"
              ? `/api/drive/folders/${renamingFile.id}`
              : `/api/drive/files/${renamingFile.id}`;
            const res = await fetch(endpoint, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ name: newName }),
            });
            if (res.ok) {
              toastSuccess("Renamed successfully");
              await loadData();
            }
          } catch (err) {
            toastError(err, "Failed to rename");
          }
        }}
      />
    </DashboardLayout>
  );
}
