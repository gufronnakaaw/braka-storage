import prisma from '@/lib/server/prisma';
import type { FileItem, FolderBreadcrumb, StorageUsage } from '@/lib/types';
import { getFileTypeFromExtension, getFileTypeFromMime } from '@/lib/utils';
import Sharp from 'sharp';
import { auth } from '../auth';
import { logActivity } from './activity-log';
import { AppError } from './errors';
import s3 from './s3';

export async function getStorageUsage(): Promise<StorageUsage> {
  const result = await prisma.file.aggregate({
    _sum: { size: true },
    _count: true,
    where: { status: 'READY' },
  });

  const usedBytes = result._sum.size ?? 0;
  const fileCount = result._count;
  const maxBytes = 10 * 1024 * 1024 * 1024; // 10 GB

  return {
    usedBytes,
    maxBytes,
    fileCount,
    percentage: Math.min(Math.round((usedBytes / maxBytes) * 100), 100),
  };
}

async function isUserCreated(createdBy: string): Promise<boolean> {
  const user = await prisma.user.findFirst({ where: { fullname: createdBy } });
  return user !== null;
}

function shortId(len = 8): string {
  const bytes = new Uint8Array(len / 2);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

function folderToItem(folder: {
  id: string;
  name: string;
  parent_id: string | null;
  created_at: Date;
  updated_at: Date;
  created_by: string;
}): FileItem {
  return {
    id: folder.id,
    name: folder.name,
    type: 'folder',
    parentId: folder.parent_id,
    createdAt: folder.created_at.toISOString(),
    modifiedAt: folder.updated_at.toISOString(),
    ownerId: folder.created_by,
    createdBy: folder.created_by,
    isTrashed: false,
  };
}

function fileToItem(file: {
  id: string;
  filename: string;
  size: number;
  mime_type: string;
  key: string;
  thumbnail_key: string | null;
  folder_id: string;
  created_at: Date;
  updated_at: Date;
  created_by: string;
}): FileItem {
  const ext = file.filename.includes('.')
    ? (file.filename.split('.').pop() ?? '')
    : '';
  const typeFromMime = getFileTypeFromMime(file.mime_type);

  return {
    id: file.id,
    name: file.filename,
    type: typeFromMime !== "other" ? typeFromMime : getFileTypeFromExtension(ext),
    size: file.size,
    mimeType: file.mime_type,
    extension: ext || undefined,
    parentId: file.folder_id,
    key: file.key,
    thumbnailUrl: file.thumbnail_key ?? undefined,
    createdAt: file.created_at.toISOString(),
    modifiedAt: file.updated_at.toISOString(),
    ownerId: file.created_by,
    createdBy: file.created_by,
    isTrashed: false,
  };
}

export async function getFilesByParent(
  parentId: string | null,
): Promise<FileItem[]> {
  const folders = await prisma.folder.findMany({
    where: {
      parent_id: parentId,
    },
    orderBy: { name: 'asc' },
  });

  const files = await prisma.file.findMany({
    where: {
      folder_id: parentId ?? undefined,
      status: 'READY',
    },
    orderBy: { filename: 'asc' },
  });

  return [...folders.map(folderToItem), ...files.map(fileToItem)];
}

export async function getFileById(id: string): Promise<FileItem | undefined> {
  const folder = await prisma.folder.findUnique({
    where: { id },
  });

  if (folder) return folderToItem(folder);

  const file = await prisma.file.findUnique({
    where: { id, status: 'READY' },
  });

  if (file) return fileToItem(file);

  return undefined;
}

export async function createFolder(
  name: string,
  parentId: string | null,
): Promise<FileItem> {
  const session = await auth();
  const performedBy = session?.user?.name || 'system';

  const folder = await prisma.folder.create({
    data: {
      name,
      parent_id: parentId,
      created_by: performedBy,
      updated_by: performedBy,
    },
  });

  await logActivity({
    action: 'CREATE',
    entityType: 'FOLDER',
    entityId: folder.id,
    entityName: folder.name,
    description: `Created folder "${folder.name}"`,
    performedBy,
  });

  return folderToItem(folder);
}

export async function getBreadcrumbs(
  folderId: string | null,
): Promise<FolderBreadcrumb[]> {
  if (folderId === null) {
    return [{ id: null, name: 'Drive' }];
  }

  const crumbs: FolderBreadcrumb[] = [];
  let currentId: string | null = folderId;

  while (currentId !== null) {
    const folderRow: {
      id: string;
      name: string;
      parent_id: string | null;
    } | null = await prisma.folder.findUnique({
      where: { id: currentId },
      select: { id: true, name: true, parent_id: true },
    });

    if (!folderRow) break;

    crumbs.unshift({ id: folderRow.id, name: folderRow.name });
    currentId = folderRow.parent_id;
  }

  crumbs.unshift({ id: null, name: 'Drive' });
  return crumbs;
}

export async function searchFiles(query: string): Promise<FileItem[]> {
  const q = query.toLowerCase();

  const folders = await prisma.folder.findMany({
    where: {
      name: { contains: q, mode: 'insensitive' },
    },
    orderBy: { name: 'asc' },
  });

  const files = await prisma.file.findMany({
    where: {
      filename: { contains: q, mode: 'insensitive' },
      status: 'READY',
    },
    orderBy: { filename: 'asc' },
  });

  return [...folders.map(folderToItem), ...files.map(fileToItem)];
}

export async function resolveSlugToFolderId(
  slug: string[],
): Promise<string | null> {
  let currentId: string | null = null;

  for (const segment of slug) {
    const folderRow: { id: string } | null = await prisma.folder.findFirst({
      where: {
        id: segment,
        parent_id: currentId,
      },
    });

    if (!folderRow) return null;
    currentId = folderRow.id;
  }

  return currentId;
}

export async function getFolderPath(folderId: string): Promise<string[]> {
  const path: string[] = [];
  let currentId: string | null = folderId;

  while (currentId !== null) {
    const folderRow: { id: string; parent_id: string | null } | null =
      await prisma.folder.findUnique({
        where: { id: currentId },
        select: { id: true, parent_id: true },
      });

    if (!folderRow) break;

    path.unshift(folderRow.id);
    currentId = folderRow.parent_id;
  }

  return path;
}

interface PresignInput {
  filename: string;
  mimeType: string;
  size: number;
}

interface PresignedFile {
  filename: string;
  key: string;
  uploadUrl: string;
  mimeType: string;
  size: number;
}

export async function generatePresignedUrls(
  folderId: string,
  files: PresignInput[],
): Promise<PresignedFile[]> {
  const folder = await prisma.folder.findUnique({ where: { id: folderId } });
  if (!folder) throw new Error('Folder not found');

  const results: PresignedFile[] = [];

  for (const file of files) {
    const ext = file.filename.includes('.')
      ? '.' + file.filename.split('.').pop()
      : '';
    const baseName = file.filename.includes('.')
      ? file.filename.slice(0, file.filename.lastIndexOf('.'))
      : file.filename;
    const safeName = baseName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    const key = `${folderId}/${shortId()}-${safeName}${ext}`;

    const uploadUrl = s3.presign(key, {
      method: 'PUT',
      type: file.mimeType,
      expiresIn: 3600,
    });

    results.push({
      filename: file.filename,
      key,
      uploadUrl,
      mimeType: file.mimeType,
      size: file.size,
    });
  }

  return results;
}

interface ConfirmFileInput {
  key: string;
  filename: string;
  mimeType: string;
  size: number;
}

export async function confirmUploads(
  folderId: string,
  files: ConfirmFileInput[],
): Promise<void> {
  const session = await auth();
  const performedBy = session?.user?.name || 'system';

  const folder = await prisma.folder.findUnique({ where: { id: folderId } });
  if (!folder) throw new AppError('NotFoundError', 'Folder not found', 404);

  const createdFiles = [];

  for (const file of files) {
    const record = await prisma.file.create({
      data: {
        filename: file.filename,
        size: file.size,
        mime_type: file.mimeType,
        key: file.key,
        status: 'READY',
        folder_id: folderId,
        created_by: performedBy,
        updated_by: performedBy,
      },
    });

    if (file.mimeType.startsWith('image/')) {
      generateThumbnail(record.id, file.key).catch(() => {});
    }

    await logActivity({
      action: 'UPLOAD',
      entityType: 'FILE',
      entityId: record.id,
      entityName: record.filename,
      description: `Uploaded file "${file.filename}"`,
      performedBy,
    });

    createdFiles.push(record);
  }
}

async function generateThumbnail(fileId: string, key: string) {
  const buf = await s3.file(key).arrayBuffer();
  const webp = await Sharp(buf)
    .resize({ width: 200, withoutEnlargement: true })
    .webp({ quality: 80 })
    .toBuffer();
  const thumbKey = `thumbnail/${fileId}.webp`;
  await s3.write(thumbKey, webp);
  await prisma.file.update({
    where: { id: fileId },
    data: { thumbnail_key: thumbKey },
  });
}

export async function deleteFile(fileId: string): Promise<boolean> {
  const session = await auth();
  const performedBy = session?.user?.name || 'system';

  const file = await prisma.file.findUnique({ where: { id: fileId } });
  if (!file) return false;

  if (!(await isUserCreated(file.created_by))) {
    throw new AppError(
      'ForbiddenError',
      'This file was created by an external service and cannot be deleted',
      403,
    );
  }

  if (file.status === 'READY') {
    try {
      await s3.delete(file.key);
    } catch {}
    if (file.thumbnail_key) {
      try {
        await s3.delete(file.thumbnail_key);
      } catch {}
    }
  }

  await prisma.file.delete({ where: { id: fileId } });

  await logActivity({
    action: 'DELETE',
    entityType: 'FILE',
    entityId: file.id,
    entityName: file.filename,
    description: `Deleted file "${file.filename}"`,
    performedBy,
  });

  return true;
}

export async function deleteFolder(folderId: string): Promise<boolean> {
  const session = await auth();
  const performedBy = session?.user?.name || 'system';

  const folder = await prisma.folder.findUnique({ where: { id: folderId } });
  if (!folder) return false;

  if (!(await isUserCreated(folder.created_by))) {
    throw new AppError(
      'ForbiddenError',
      'This folder was created by an external service and cannot be deleted',
      403,
    );
  }

  const childFiles = await prisma.file.findMany({
    where: { folder_id: folderId },
  });
  for (const child of childFiles) {
    if (!(await isUserCreated(child.created_by))) {
      throw new AppError(
        'ForbiddenError',
        `Cannot delete folder: file "${child.filename}" was created by an external service`,
        403,
      );
    }
  }

  const childFolders = await prisma.folder.findMany({
    where: { parent_id: folderId },
  });
  for (const child of childFolders) {
    if (!(await isUserCreated(child.created_by))) {
      throw new AppError(
        'ForbiddenError',
        `Cannot delete folder: subfolder "${child.name}" was created by an external service`,
        403,
      );
    }
  }

  for (const file of childFiles) {
    if (file.status === 'READY') {
      try {
        await s3.delete(file.key);
      } catch {}
      if (file.thumbnail_key) {
        try {
          await s3.delete(file.thumbnail_key);
        } catch {}
      }
    }
  }

  await prisma.folder.delete({ where: { id: folderId } });

  await logActivity({
    action: 'DELETE',
    entityType: 'FOLDER',
    entityId: folder.id,
    entityName: folder.name,
    description: `Deleted folder "${folder.name}"`,
    performedBy,
  });

  return true;
}

export async function renameFile(
  fileId: string,
  newName: string,
): Promise<FileItem> {
  const session = await auth();
  const performedBy = session?.user?.name || 'system';

  const file = await prisma.file.findUnique({ where: { id: fileId } });
  if (!file) throw new AppError('NotFoundError', 'File not found', 404);

  if (!(await isUserCreated(file.created_by))) {
    throw new AppError(
      'ForbiddenError',
      'This file was created by an external service and cannot be renamed',
      403,
    );
  }

  const updated = await prisma.file.update({
    where: { id: fileId },
    data: { filename: newName, updated_by: performedBy },
  });

  await logActivity({
    action: 'RENAME',
    entityType: 'FILE',
    entityId: file.id,
    entityName: newName,
    description: `Renamed file "${file.filename}" to "${newName}"`,
    performedBy,
  });

  return fileToItem(updated);
}

export async function renameFolder(
  folderId: string,
  newName: string,
): Promise<FileItem> {
  const session = await auth();
  const performedBy = session?.user?.name || 'system';

  const folder = await prisma.folder.findUnique({ where: { id: folderId } });
  if (!folder) throw new AppError('NotFoundError', 'Folder not found', 404);

  if (!(await isUserCreated(folder.created_by))) {
    throw new AppError(
      'ForbiddenError',
      'This folder was created by an external service and cannot be renamed',
      403,
    );
  }

  const updated = await prisma.folder.update({
    where: { id: folderId },
    data: { name: newName, updated_by: performedBy },
  });

  await logActivity({
    action: 'RENAME',
    entityType: 'FOLDER',
    entityId: folder.id,
    entityName: newName,
    description: `Renamed folder "${folder.name}" to "${newName}"`,
    performedBy,
  });

  return folderToItem(updated);
}
