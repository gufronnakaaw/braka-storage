import { apiSuccess, getLogs, LogsQuerySchema, parseQuery, withAuth, withErrorHandler } from "@/lib/server";

export const GET = withErrorHandler(withAuth(async (req) => {
  const { searchParams } = new URL(req.url);
  const { page, pageSize, timeFilter } = parseQuery(LogsQuerySchema, {
    page: searchParams.get("page"),
    pageSize: searchParams.get("pageSize"),
    timeFilter: searchParams.get("timeFilter"),
  });

  const result = await getLogs(page, pageSize, timeFilter);
  return apiSuccess(result);
}));
