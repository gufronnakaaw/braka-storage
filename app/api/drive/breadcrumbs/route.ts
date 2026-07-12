import { apiSuccess, BreadcrumbsQuerySchema, getBreadcrumbs, parseQuery, withAuth, withErrorHandler } from "@/lib/server";

export const GET = withErrorHandler(withAuth(async (req) => {
  const { searchParams } = new URL(req.url);
  const { folderId } = parseQuery(BreadcrumbsQuerySchema, {
    folderId: searchParams.get("folderId"),
  });

  const breadcrumbs = await getBreadcrumbs(folderId);
  return apiSuccess(breadcrumbs);
}));
