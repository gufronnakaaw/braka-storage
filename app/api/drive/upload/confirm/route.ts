import { apiSuccess, confirmUploads, ConfirmUploadSchema, parseBody, withAuth, withErrorHandler } from "@/lib/server";

export const POST = withErrorHandler(withAuth(async (req) => {
  const data = await parseBody(req, ConfirmUploadSchema);
  await confirmUploads(data.fileIds);
  return apiSuccess({ message: "Uploads confirmed" });
}));
