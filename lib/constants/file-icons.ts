import type { FileType } from "@/lib/types/file";
import {
  Archive,
  Code,
  FileSpreadsheet,
  FileText,
  Folder,
  Image,
  FileType as LucideFileType,
  Music,
  Presentation,
  Video,
} from "lucide-react";
import type { ComponentType } from "react";

export const FILE_ICON_MAP: Record<FileType, ComponentType<{ size?: number; className?: string }>> = {
  folder: Folder,
  image: Image,
  video: Video,
  audio: Music,
  pdf: FileText,
  document: FileText,
  spreadsheet: FileSpreadsheet,
  presentation: Presentation,
  archive: Archive,
  code: Code,
  text: FileText,
  other: LucideFileType,
};

export const FILE_COLOR_MAP: Record<FileType, string> = {
  folder: "text-primary",
  image: "text-pink-400",
  video: "text-purple-400",
  audio: "text-orange-400",
  pdf: "text-red-400",
  document: "text-blue-400",
  spreadsheet: "text-emerald-400",
  presentation: "text-amber-400",
  archive: "text-zinc-400",
  code: "text-primary",
  text: "text-zinc-400",
  other: "text-zinc-500",
};
