import { apiSuccess, FolderPathQuerySchema, getFolderPath, parseQuery, withAuth, withErrorHandler } from "@/lib/server";

export const GET = withErrorHandler(withAuth(async (req) => {
  const { searchParams } = new URL(req.url);
  const { folderId } = parseQuery(FolderPathQuerySchema, {
    folderId: searchParams.get("folderId"),
  });

  const path = await getFolderPath(folderId);
  return apiSuccess(path);
}));
