import prisma from "@/lib/server/prisma";
import type { PaginatedLogs, TimeFilter } from "@/lib/types";
import { TIME_FILTER_MS } from "@/lib/types";

export async function getLogs(
  page: number,
  pageSize: number,
  timeFilter: TimeFilter,
): Promise<PaginatedLogs> {
  const since = new Date(Date.now() - TIME_FILTER_MS[timeFilter]);
  const skip = (page - 1) * pageSize;

  const [data, total] = await Promise.all([
    prisma.activityLog.findMany({
      where: { created_at: { gte: since } },
      orderBy: { created_at: "desc" },
      skip,
      take: pageSize,
    }),
    prisma.activityLog.count({
      where: { created_at: { gte: since } },
    }),
  ]);

  return {
    data: data.map((log) => ({
      ...log,
      created_at: log.created_at.toISOString(),
    })),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}
