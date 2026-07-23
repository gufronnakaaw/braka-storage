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
import { fetchFolderPath } from "@/lib/api/drive";
import {
  useCreateFolder,
  useDeleteItem,
  useDriveBreadcrumbs,
  useDriveItems,
  useDriveSearch,
  useDriveViewMode,
  useRenameItem,
} from "@/lib/hooks";
import type { FileItem } from "@/lib/types";
import { downloadFile } from "@/lib/utils";
import { toastError, toastSuccess } from "@/lib/utils/toast";
import { FolderPlus, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { use, useMemo, useRef, useState } from "react";

export default function FolderPage({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = use(params);
  const router = useRouter();
  const uploadRef = useRef<UploadZoneHandle>(null);

  const { viewMode, setViewMode } = useDriveViewMode();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "modifiedAt" | "size" | "type">("name");
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [renamingFile, setRenamingFile] = useState<FileItem | null>(null);

  const folderId = slug.length > 0 ? slug[slug.length - 1] : null;
  const { data: items, isLoading: itemsLoading, mutate: mutateItems } = useDriveItems(folderId);
  const { data: searchResults } = useDriveSearch(searchQuery);
  const { data: breadcrumbs, isLoading: breadcrumbsLoading } = useDriveBreadcrumbs(folderId);

  const { trigger: createFolder } = useCreateFolder();
  const { trigger: deleteItem } = useDeleteItem();
  const { trigger: renameItem } = useRenameItem();

  const folderName = breadcrumbs?.[breadcrumbs.length - 1]?.name ?? "";
  const displayFiles = useMemo(() => {
    const files = searchQuery ? searchResults : items;
    return files ?? [];
  }, [searchQuery, searchResults, items]);

  const notFound = slug.length > 0 && breadcrumbs && breadcrumbs.length === 1;
  const loading = !notFound && (itemsLoading || breadcrumbsLoading);

  async function handleFolderOpen(subFolderId: string) {
    const subPath = await fetchFolderPath(subFolderId);
    router.push(`/${subPath.join("/")}`);
  }



  async function handleDelete(file: FileItem) {
    try {
      await deleteItem({
        id: file.id,
        type: file.type === "folder" ? "folder" : "file",
        parentId: folderId,
      });
    } catch (err) {
      toastError(err, "Failed to delete");
    }
  }

  function handleCopyUrl(file: FileItem) {
    if (!file.key) return;
    const base = process.env.NEXT_PUBLIC_PREVIEW_URL ?? "";
    const url = `${base}/${file.key}`;
    navigator.clipboard.writeText(url);
    toastSuccess("URL copied to clipboard");
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

  if (!loading && !notFound && !breadcrumbs) return null;

  return (
    <DashboardLayout activeView="drive" mobileTitle={folderName}>
      <div className="hidden md:block">
        <Topbar
          title={folderName}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />
      </div>

      <Breadcrumb
        items={breadcrumbs ?? []}
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

      {loading ? (
        viewMode === "grid" ? <FileGridSkeleton /> : <FileListSkeleton />
      ) : (
        <FileBrowser
          files={displayFiles}
          viewMode={viewMode}
          onFolderOpen={handleFolderOpen}
          onFilePreview={setPreviewFile}
          onDownload={(file) => downloadFile(file.id, file.name)}
          onCopyUrl={handleCopyUrl}
          onRename={(file) => setRenamingFile(file)}
          onDelete={handleDelete}
          sortBy={sortBy}
          onSortChange={setSortBy}
        />
      )}

      <UploadZone ref={uploadRef} enabled folderId={folderId} onUploaded={() => mutateItems()} />

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
            await createFolder({ name, parentId: folderId });
            toastSuccess("Folder created");
          } catch (err) {
            toastError(err, "Failed to create folder");
          }
        }}
      />

      <PreviewModal file={previewFile} onClose={() => setPreviewFile(null)} onCopyUrl={handleCopyUrl} />
      <RenameModal
        open={!!renamingFile}
        currentName={renamingFile?.name ?? ""}
        onClose={() => setRenamingFile(null)}
        onRename={async (newName) => {
          if (!renamingFile) return;
          try {
            await renameItem({
              id: renamingFile.id,
              type: renamingFile.type === "folder" ? "folder" : "file",
              name: newName,
              parentId: folderId,
            });
            toastSuccess("Renamed successfully");
          } catch (err) {
            toastError(err, "Failed to rename");
          }
        }}
      />
    </DashboardLayout>
  );
}
