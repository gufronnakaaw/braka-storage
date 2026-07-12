import { apiSuccess, generatePresignedUrls, parseBody, PresignUploadSchema, withAuth, withErrorHandler } from "@/lib/server";

export const POST = withErrorHandler(withAuth(async (req) => {
  const data = await parseBody(req, PresignUploadSchema);
  const presigned = await generatePresignedUrls(data.folderId, data.files);
  return apiSuccess(presigned, 201);
}));
