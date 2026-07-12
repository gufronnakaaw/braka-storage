import { apiSuccess, parseQuery, ResolveQuerySchema, resolveSlugToFolderId, withAuth, withErrorHandler } from "@/lib/server";

export const GET = withErrorHandler(withAuth(async (req) => {
  const { searchParams } = new URL(req.url);
  const { slug } = parseQuery(ResolveQuerySchema, {
    slug: searchParams.getAll("slug"),
  });

  const folderId = await resolveSlugToFolderId(slug);
  return apiSuccess(folderId);
}));
