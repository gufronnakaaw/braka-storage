import { apiSuccess, getFilesByParent, ItemsQuerySchema, parseQuery, withAuth, withErrorHandler } from "@/lib/server";

export const GET = withErrorHandler(withAuth(async (req) => {
  const { searchParams } = new URL(req.url);
  const { parentId } = parseQuery(ItemsQuerySchema, {
    parentId: searchParams.get("parentId"),
  });

  const items = await getFilesByParent(parentId);
  return apiSuccess(items);
}));
