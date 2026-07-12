import { FILE_COLOR_MAP, FILE_ICON_MAP } from "@/lib/constants/file-icons";
import type { FileType as AppFileType } from "@/lib/types";
import { cn } from "@/lib/utils";
import { File } from "lucide-react";

interface FileIconProps {
  type: AppFileType;
  className?: string;
  size?: number;
}

export function FileIcon({ type, className, size = 20 }: FileIconProps) {
  const Icon = FILE_ICON_MAP[type] ?? File;
  const color = FILE_COLOR_MAP[type] ?? "text-zinc-500";

  return <Icon className={cn(color, className)} size={size} />;
}
