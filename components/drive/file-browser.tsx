'use client';

import { FileIcon } from '@/components/drive/file-icon';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { FileItem } from '@/lib/types';
import { cn, formatFileSize } from '@/lib/utils';
import {
  ArrowUpDown,
  ChevronDown,
  ChevronUp,
  Download,
  Edit3,
  Eye,
  FolderOpen,
  Link,
  MoreHorizontal,
  Trash2,
} from 'lucide-react';
import type { ComponentType, ReactNode } from 'react';
import { useMemo, useState } from 'react';

const PREVIEW_BASE = process.env.NEXT_PUBLIC_PREVIEW_URL ?? '';

interface FileBrowserProps {
  files: FileItem[];
  viewMode: 'grid' | 'list';
  onFolderOpen: (folderId: string) => void;
  onFilePreview: (file: FileItem) => void;
  onDownload?: (file: FileItem) => void;
  onCopyUrl?: (file: FileItem) => void;
  onRename?: (file: FileItem) => void;
  onDelete?: (file: FileItem) => void;
  sortBy: 'name' | 'modifiedAt' | 'size' | 'type';
  onSortChange: (sort: 'name' | 'modifiedAt' | 'size' | 'type') => void;
  disableActions?: boolean;
}

type SortDir = 'asc' | 'desc';

interface MenuItemProps {
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
  children: ReactNode;
}

export function FileBrowser({
  files,
  viewMode,
  onFolderOpen,
  onFilePreview,
  onDownload,
  onCopyUrl,
  onRename,
  onDelete,
  sortBy,
  onSortChange,
  disableActions = false,
}: FileBrowserProps) {
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [thumbErrors, setThumbErrors] = useState<Set<string>>(new Set());

  function handleThumbError(fileId: string) {
    setThumbErrors((prev) => new Set(prev).add(fileId));
  }

  const sortedFiles = useMemo(() => {
    const sorted = [...files].sort((a, b) => {
      if (a.type === 'folder' && b.type !== 'folder') return -1;
      if (a.type !== 'folder' && b.type === 'folder') return 1;

      let cmp = 0;
      switch (sortBy) {
        case 'name':
          cmp = a.name.localeCompare(b.name);
          break;
        case 'modifiedAt':
          cmp =
            new Date(a.modifiedAt).getTime() - new Date(b.modifiedAt).getTime();
          break;
        case 'size':
          cmp = (a.size ?? 0) - (b.size ?? 0);
          break;
        case 'type':
          cmp = a.type.localeCompare(b.type) || a.name.localeCompare(b.name);
          break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return sorted;
  }, [files, sortBy, sortDir]);

  function handleSort(col: 'name' | 'modifiedAt' | 'size' | 'type') {
    if (sortBy === col) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      onSortChange(col);
      setSortDir('asc');
    }
  }

  function SortIcon({ col }: { col: string }) {
    if (sortBy !== col)
      return (
        <ArrowUpDown className="size-3 opacity-0 group-hover/col:opacity-100" />
      );
    return sortDir === 'asc' ? (
      <ChevronUp className="size-3 text-primary" />
    ) : (
      <ChevronDown className="size-3 text-primary" />
    );
  }

  function renderFileMenu(
    file: FileItem,
    Item: ComponentType<MenuItemProps>,
    Separator: ComponentType,
  ) {
    const isFile = file.type !== 'folder';

    return (
      <>
        <Item
          className="gap-2 text-sm cursor-pointer"
          onClick={() => (isFile ? onFilePreview(file) : onFolderOpen(file.id))}
        >
          {isFile ? (
            <>
              <Eye className="size-3.5" /> Preview
            </>
          ) : (
            <>
              <FolderOpen className="size-3.5" /> Open
            </>
          )}
        </Item>
        {isFile && (
          <Item
            className="gap-2 text-sm cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              onDownload?.(file);
            }}
          >
            <Download className="size-3.5" /> Download
          </Item>
        )}
        {isFile && (
          <Item
            className="gap-2 text-sm cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              onCopyUrl?.(file);
            }}
          >
            <Link className="size-3.5" /> Copy URL
          </Item>
        )}
        {isFile && <Separator />}
        <Item
          className="gap-2 text-sm cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            onRename?.(file);
          }}
        >
          <Edit3 className="size-3.5" /> Rename
        </Item>
        <Separator />
        <Item
          className="gap-2 text-sm text-destructive cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            onDelete?.(file);
          }}
        >
          <Trash2 className="size-3.5" /> Delete
        </Item>
      </>
    );
  }

  if (files.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4">
        <div className="flex items-center justify-center size-16 rounded-2xl bg-secondary/50 border border-border">
          <FolderOpen className="size-8 text-muted-foreground/50" />
        </div>
        <div className="text-center">
          <p className="text-sm text-muted-foreground">This folder is empty</p>
          <p className="text-xs text-muted-foreground/60 mt-1">
            Upload files or create a folder to get started.
          </p>
        </div>
      </div>
    );
  }

  function isImageFile(file: FileItem): boolean {
    return file.type === 'image' && !!file.thumbnailUrl && !!PREVIEW_BASE;
  }

  function getThumbnailUrl(file: FileItem): string {
    return `${PREVIEW_BASE}/${file.thumbnailUrl}`;
  }

  if (viewMode === 'grid') {
    return (
      <div className="flex-1 p-5 overflow-auto will-change-transform">
        <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-3">
          {sortedFiles.map((file) => {
            const showThumbnail = isImageFile(file) && !thumbErrors.has(file.id);

            const item = (
              <div
                key={file.id}
                onClick={() =>
                  file.type === 'folder'
                    ? onFolderOpen(file.id)
                    : onFilePreview(file)
                }
                onMouseEnter={() => setHoveredId(file.id)}
                onMouseLeave={() => setHoveredId(null)}
                className={cn(
                  'group flex flex-col items-center gap-3 p-4 rounded-xl border transition-transform duration-150 cursor-pointer',
                  'bg-card/50 hover:-translate-y-0.5 hover:shadow-lg contain-[layout_style_paint]',
                  hoveredId === file.id
                    ? 'border-primary/30 glow-accent'
                    : 'border-border',
                )}
              >
                {showThumbnail ? (
                  <div className="size-20 rounded-lg overflow-hidden bg-secondary/30 ring-1 ring-black/5">
                    <img
                      src={getThumbnailUrl(file)}
                      alt={file.name}
                      className="size-full object-cover"
                      loading="lazy"
                      decoding="async"
                      width={80}
                      height={80}
                      onError={() => handleThumbError(file.id)}
                    />
                  </div>
                ) : (
                  <div className="flex items-center justify-center size-12 rounded-lg bg-secondary/50">
                    <FileIcon type={file.type} size={28} />
                  </div>
                )}

                <p className="w-full text-center text-xs font-medium text-foreground truncate px-1">
                  {file.name}
                </p>

                {file.size && (
                  <p className="text-[10px] text-muted-foreground">
                    {formatFileSize(file.size)}
                  </p>
                )}
              </div>
            );

            return disableActions ? (
              item
            ) : (
              <ContextMenu key={file.id}>
                <ContextMenuTrigger>{item}</ContextMenuTrigger>
                <ContextMenuContent className="bg-card border-border w-48">
                  {renderFileMenu(file, ContextMenuItem, ContextMenuSeparator)}
                </ContextMenuContent>
              </ContextMenu>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto">
      <div className="flex items-center h-9 px-5 border-b border-border text-[11px] uppercase tracking-wider text-muted-foreground select-none sticky top-0 bg-background/90 backdrop-blur-sm z-10">
        <button
          onClick={() => handleSort('name')}
          className="group/col flex flex-1 cursor-pointer items-center gap-1 transition-colors hover:text-foreground"
        >
          Name <SortIcon col="name" />
        </button>
        <button
          onClick={() => handleSort('modifiedAt')}
          className="group/col flex w-36 cursor-pointer items-center gap-1 transition-colors hover:text-foreground"
        >
          Modified <SortIcon col="modifiedAt" />
        </button>
        <span className="flex w-32 items-center gap-1 text-muted-foreground">
          Created By
        </span>
        <button
          onClick={() => handleSort('type')}
          className="group/col flex w-24 cursor-pointer items-center gap-1 transition-colors hover:text-foreground"
        >
          Type <SortIcon col="type" />
        </button>
        <button
          onClick={() => handleSort('size')}
          className="group/col flex w-20 cursor-pointer items-center justify-end gap-1 text-right transition-colors hover:text-foreground"
        >
          Size <SortIcon col="size" />
        </button>
        <div className="w-10" />
      </div>

      {sortedFiles.map((file) => {
        const row = (
          <div
            key={file.id}
            onClick={() =>
              file.type === 'folder'
                ? onFolderOpen(file.id)
                : onFilePreview(file)
            }
            className={cn(
              'group flex items-center h-11 px-5 border-b border-border/50 transition-colors cursor-pointer',
              hoveredId === file.id
                ? 'bg-secondary/50'
                : 'hover:bg-secondary/30',
            )}
            onMouseEnter={() => setHoveredId(file.id)}
            onMouseLeave={() => setHoveredId(null)}
          >
            <div className="flex items-center gap-2.5 flex-1 min-w-0">
              <FileIcon type={file.type} size={16} />
              <span className="text-sm text-foreground truncate">
                {file.name}
              </span>
            </div>

            <span className="w-36 text-xs text-muted-foreground">
              {new Date(file.modifiedAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>

            <span className="w-32 text-xs text-muted-foreground truncate">
              {file.createdBy || '—'}
            </span>

            <span className="w-24 text-xs text-muted-foreground capitalize">
              {file.type === 'folder'
                ? 'Folder'
                : (file.extension ?? file.type)}
            </span>

            <span className="w-20 text-xs text-muted-foreground text-right">
              {file.size ? formatFileSize(file.size) : '—'}
            </span>

            {!disableActions && (
              <div className="w-10 flex justify-end">
                <DropdownMenu>
                  <DropdownMenuTrigger
                    onClick={(e) => e.stopPropagation()}
                    className={cn(
                      'flex size-7 cursor-pointer items-center justify-center rounded-md transition-all',
                      hoveredId === file.id
                        ? 'text-foreground hover:bg-secondary'
                        : 'text-transparent',
                    )}
                  >
                    <MoreHorizontal className="size-4" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="bg-card border-border w-48"
                  >
                    {renderFileMenu(
                      file,
                      DropdownMenuItem,
                      DropdownMenuSeparator,
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>
        );

        return disableActions ? (
          row
        ) : (
          <ContextMenu key={file.id}>
            <ContextMenuTrigger>{row}</ContextMenuTrigger>
            <ContextMenuContent className="bg-card border-border w-48">
              {renderFileMenu(file, ContextMenuItem, ContextMenuSeparator)}
            </ContextMenuContent>
          </ContextMenu>
        );
      })}
    </div>
  );
}
