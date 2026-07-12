"use client";

import { parseApiResponse } from "@/lib/api/errors";
import { fetcher } from "@/lib/fetcher";
import type { FileItem } from "@/lib/types";
import useSWR, { mutate } from "swr";
import useSWRMutation from "swr/mutation";


export function useDriveItems(parentId: string | null | undefined) {
  const key =
    parentId === undefined
      ? null
      : parentId
        ? `/api/drive/items?parentId=${encodeURIComponent(parentId)}`
        : "/api/drive/items";
  return useSWR<FileItem[]>(key, fetcher);
}

export function useCreateFolder() {
  return useSWRMutation(
    "create-folder",
    async (
      _key: string,
      { arg }: { arg: { name: string; parentId: string | null } },
    ) => {
      const res = await fetch("/api/drive/folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(arg),
      });
      const result = await parseApiResponse<FileItem>(res);
      const itemsKey = arg.parentId
        ? `/api/drive/items?parentId=${encodeURIComponent(arg.parentId)}`
        : "/api/drive/items";
      const crumbsKey = arg.parentId
        ? `/api/drive/breadcrumbs?folderId=${encodeURIComponent(arg.parentId)}`
        : "/api/drive/breadcrumbs";
      void mutate(itemsKey);
      void mutate(crumbsKey);
      return result;
    },
  );
}

export function useDeleteItem() {
  return useSWRMutation(
    "delete-item",
    async (
      _key: string,
      {
        arg,
      }: {
        arg: {
          id: string;
          type: "file" | "folder";
          parentId: string | null;
        };
      },
    ) => {
      const endpoint =
        arg.type === "folder"
          ? `/api/drive/folders/${arg.id}`
          : `/api/drive/files/${arg.id}`;
      const res = await fetch(endpoint, { method: "DELETE" });
      await parseApiResponse<unknown>(res);
      const itemsKey = arg.parentId
        ? `/api/drive/items?parentId=${encodeURIComponent(arg.parentId)}`
        : "/api/drive/items";
      void mutate(itemsKey);
    },
  );
}

export function useRenameItem() {
  return useSWRMutation(
    "rename-item",
    async (
      _key: string,
      {
        arg,
      }: {
        arg: {
          id: string;
          type: "file" | "folder";
          name: string;
          parentId: string | null;
        };
      },
    ) => {
      const endpoint =
        arg.type === "folder"
          ? `/api/drive/folders/${arg.id}`
          : `/api/drive/files/${arg.id}`;
      const res = await fetch(endpoint, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: arg.name }),
      });
      await parseApiResponse<unknown>(res);
      const itemsKey = arg.parentId
        ? `/api/drive/items?parentId=${encodeURIComponent(arg.parentId)}`
        : "/api/drive/items";
      void mutate(itemsKey);
      if (arg.type === "folder") {
        void mutate(`/api/drive/folders/${arg.id}`);
      }
    },
  );
}
