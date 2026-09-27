import { z } from "zod";
import {
  MaintenanceRequestPriority,
  MaintenanceRequestStatus,
} from "~/types/maintenance-request";

/** Mirrors CreateMaintenanceRequestDto: no tenant and no unit = common area */
export const createMaintenanceRequestSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().min(1, "Description is required").max(5000),
  priority: z.nativeEnum(MaintenanceRequestPriority).optional(),
  tenantId: z.string().uuid().optional(),
  unitId: z.string().uuid().optional(),
});

export const updateMaintenanceRequestSchema = z.object({
  status: z.nativeEnum(MaintenanceRequestStatus).optional(),
  note: z.string().min(1, "Note cannot be empty").optional(),
});

export type CreateMaintenanceRequestSchema = z.output<
  typeof createMaintenanceRequestSchema
>;
export type UpdateMaintenanceRequestSchema = z.output<
  typeof updateMaintenanceRequestSchema
>;
