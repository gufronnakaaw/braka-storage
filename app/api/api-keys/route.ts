import { apiSuccess, createApiKey, CreateApiKeySchema, listApiKeys, parseBody, withAuth, withErrorHandler } from "@/lib/server";

export const GET = withErrorHandler(withAuth(async () => {
  const keys = await listApiKeys();
  return apiSuccess(keys);
}));

export const POST = withErrorHandler(withAuth(async (req) => {
  const data = await parseBody(req, CreateApiKeySchema);
  const created = await createApiKey(data);
  return apiSuccess(created, 201);
}));

