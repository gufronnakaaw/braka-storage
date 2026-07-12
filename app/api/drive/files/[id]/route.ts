import { apiSuccess, deleteFile, FolderIdParamSchema, parseBody, renameFile, RenameSchema, withAuth, withErrorHandler } from "@/lib/server";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export const DELETE = withErrorHandler(withAuth(async (_: Request, context: RouteContext) => {
  const { id } = FolderIdParamSchema.parse(await context.params);
  const deleted = await deleteFile(id);
  return apiSuccess({ deleted });
}));

export const PATCH = withErrorHandler(withAuth(async (req: Request, context: RouteContext) => {
  const { id } = FolderIdParamSchema.parse(await context.params);
  const { name } = await parseBody(req, RenameSchema);
  const updated = await renameFile(id, name);
  return apiSuccess(updated);
}));
