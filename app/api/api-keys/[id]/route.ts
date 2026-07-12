import { ApiKeyIdParamSchema, apiSuccess, NotFoundError, revokeApiKey, withAuth, withErrorHandler } from "@/lib/server";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export const DELETE = withErrorHandler(withAuth(async (_: Request, context: RouteContext) => {
  const { id } = ApiKeyIdParamSchema.parse(await context.params);
  const ok = await revokeApiKey(id);

  if (!ok) {
    throw new NotFoundError("API key not found");
  }

  return apiSuccess({ message: "API key revoked successfully" });
}));
