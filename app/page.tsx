"use client";

import { CreateFolderModal } from "@/components/drive/create-folder-modal";
import { FileBrowser } from "@/components/drive/file-browser";
import { Breadcrumb } from "@/components/layout/breadcrumb";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Topbar } from "@/components/layout/topbar";
import { FileGridSkeleton, FileListSkeleton } from "@/components/ui/loading-skeleton";
import { fetchFolderPath } from "@/lib/api/drive";
import {
  useCreateFolder,
  useDriveBreadcrumbs,
  useDriveItems,
  useDriveSearch,
  useDriveViewMode,
} from "@/lib/hooks";
import { toastError, toastSuccess } from "@/lib/utils/toast";
import { FolderPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

export default function Home() {
  const router = useRouter();
  const { viewMode, setViewMode, hydrated } = useDriveViewMode();

  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "modifiedAt" | "size" | "type">("name");
  const [showCreateFolder, setShowCreateFolder] = useState(false);

  const { data: items, isLoading: itemsLoading } = useDriveItems(null);
  const { data: searchResults, isLoading: searchLoading } = useDriveSearch(searchQuery);
  const { data: breadcrumbs, isLoading: breadcrumbsLoading } = useDriveBreadcrumbs(null);
  const { trigger: createFolder } = useCreateFolder();

  const displayFiles = useMemo(() => {
    const files = searchQuery ? searchResults : items;
    return (files ?? []).filter((f) => f.type === "folder");
  }, [searchQuery, searchResults, items]);

  const loading = searchQuery ? searchLoading : (itemsLoading || breadcrumbsLoading);

  async function handleFolderOpen(folderId: string) {
    try {
      const folderPath = await fetchFolderPath(folderId);
      router.push(`/${folderPath.join("/")}`);
    } catch (err) {
      toastError(err);
    }
  }

  return (
    <DashboardLayout activeView="drive" mobileTitle="Drive">
      <div className="hidden md:block">
        <Topbar
          title=""
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
        </div>
      </div>

      {!hydrated || loading ? (
        viewMode === "grid" ? <FileGridSkeleton /> : <FileListSkeleton />
      ) : (
        <FileBrowser
          files={displayFiles}
          viewMode={viewMode}
          onFolderOpen={handleFolderOpen}
          onFilePreview={() => {}}
          sortBy={sortBy}
          onSortChange={setSortBy}
          disableActions
        />
      )}

      <CreateFolderModal
        open={showCreateFolder}
        onClose={() => setShowCreateFolder(false)}
        onCreate={async (name) => {
          try {
            await createFolder({ name, parentId: null });
            toastSuccess("Folder created");
          } catch (err) {
            toastError(err, "Failed to create folder");
          }
        }}
      />
    </DashboardLayout>
  );
}
