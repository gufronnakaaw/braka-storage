import { apiSuccess, deleteFolder, FolderIdParamSchema, getFileById, NotFoundError, parseBody, renameFolder, RenameSchema, withAuth, withErrorHandler } from "@/lib/server";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export const GET = withErrorHandler(withAuth(async (_: Request, context: RouteContext) => {
  const { id } = FolderIdParamSchema.parse(await context.params);
  const item = await getFileById(id);

  if (!item) {
    throw new NotFoundError("Folder not found");
  }

  return apiSuccess(item);
}));

export const DELETE = withErrorHandler(withAuth(async (_: Request, context: RouteContext) => {
  const { id } = FolderIdParamSchema.parse(await context.params);
  const deleted = await deleteFolder(id);
  return apiSuccess({ deleted });
}));

export const PATCH = withErrorHandler(withAuth(async (req: Request, context: RouteContext) => {
  const { id } = FolderIdParamSchema.parse(await context.params);
  const { name } = await parseBody(req, RenameSchema);
  const updated = await renameFolder(id, name);
  return apiSuccess(updated);
}));
