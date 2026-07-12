import { apiSuccess, createFolder, CreateFolderSchema, parseBody, withAuth, withErrorHandler } from "@/lib/server";

export const POST = withErrorHandler(withAuth(async (req) => {
  const data = await parseBody(req, CreateFolderSchema);
  const folder = await createFolder(data.name, data.parentId);
  return apiSuccess(folder, 201);
}));
