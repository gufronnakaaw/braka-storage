import { auth } from "@/lib/auth";
import type { Session } from "next-auth";
import { NextRequest } from "next/server";
import { AppError } from "./errors";
import { apiError } from "./response";

type Handler<TCtx = unknown> = (req: NextRequest, ctx: TCtx) => Promise<Response>;

export function withErrorHandler<TCtx>(handler: Handler<TCtx>) {
  return async (req: NextRequest, ctx: TCtx) => {
    try {
      return await handler(req, ctx);
    } catch (err) {
      if (err instanceof AppError) {
        return apiError(err.name, err.message, err.status_code, err.errors);
      }
      console.error(err);
      return apiError("InternalServerError", "Something went wrong", 500);
    }
  };
}

type AuthenticatedHandler<TCtx = unknown> = (
  req: NextRequest,
  ctx: TCtx,
  session: Session,
) => Promise<Response>;

export function withAuth<TCtx = unknown>(handler: AuthenticatedHandler<TCtx>) {
  return async (req: NextRequest, ctx: TCtx) => {
    const session = await auth();

    if (!session) {
      return apiError("Unauthorized", "Login required", 401);
    }

    return handler(req, ctx, session);
  };
}
