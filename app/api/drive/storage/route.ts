import { apiSuccess, getStorageUsage, withAuth, withErrorHandler } from "@/lib/server";

export const GET = withErrorHandler(withAuth(async () => {
  const usage = await getStorageUsage();
  return apiSuccess(usage);
}));
