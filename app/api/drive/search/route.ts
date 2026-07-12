import { apiSuccess, parseQuery, searchFiles, SearchQuerySchema, withAuth, withErrorHandler } from "@/lib/server";

export const GET = withErrorHandler(withAuth(async (req) => {
  const { searchParams } = new URL(req.url);
  const { q } = parseQuery(SearchQuerySchema, {
    q: searchParams.get("q"),
  });

  const results = await searchFiles(q);
  return apiSuccess(results);
}));
