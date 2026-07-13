export type FileType =
  | "folder"
  | "image"
  | "video"
  | "audio"
  | "pdf"
  | "document"
  | "spreadsheet"
  | "presentation"
  | "archive"
  | "code"
  | "text"
  | "other";

export interface FileItem {
  id: string;
  name: string;
  type: FileType;
  size?: number;
  mimeType?: string;
  extension?: string;
  parentId: string | null;
  key?: string;
  createdAt: string;
  modifiedAt: string;
  ownerId: string;
  createdBy: string;
  isTrashed: boolean;
  thumbnailUrl?: string;
}

export interface FolderBreadcrumb {
  id: string | null;
  name: string;
}

export interface StorageUsage {
  usedBytes: number;
  maxBytes: number;
  fileCount: number;
  percentage: number;
}
