import { prisma, s3, withAuth, withErrorHandler } from "@/lib/server";

export const GET = withErrorHandler(
  withAuth(async (req, ctx: { params: Promise<{ fileId: string }> }) => {
    const { fileId } = await ctx.params;

    const file = await prisma.file.findUnique({ where: { id: fileId } });
    if (!file) {
      return new Response("File not found", { status: 404 });
    }

    const s3File = s3.file(file.key);
    const buffer = await s3File.arrayBuffer();

    return new Response(buffer, {
      headers: {
        "Content-Type": file.mime_type || "text/plain",
        "Content-Length": String(buffer.byteLength),
      },
    });
  }),
);
