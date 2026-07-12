import type { EntityType, LogAction } from "@/lib/generated/prisma/enums";
import prisma from "@/lib/server/prisma";

interface LogActivityParams {
  action: LogAction;
  entityType: EntityType;
  entityId?: string;
  entityName?: string;
  description: string;
  ipAddress?: string;
  oldValue?: string;
  newValue?: string;
  performedBy: string;
}

export async function logActivity(data: LogActivityParams) {
  await prisma.activityLog.create({
    data: {
      action: data.action,
      entity_type: data.entityType,
      entity_id: data.entityId ?? null,
      entity_name: data.entityName ?? null,
      description: data.description,
      ip_address: data.ipAddress ?? null,
      old_value: data.oldValue ?? null,
      new_value: data.newValue ?? null,
      performed_by: data.performedBy,
    },
  });
}
