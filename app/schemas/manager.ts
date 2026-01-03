import { z } from "zod";
import { ManagerRole } from "~/types/manager";

export const createManagerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  phone: z.string().optional(),
  buildingAssignments: z
    .array(
      z.object({
        buildingId: z.string(),
        roles: z
          .array(z.nativeEnum(ManagerRole))
          .min(1, "Select at least one role per building"),
      })
    )
    .min(1, "Assign to at least one building"),
});

export const updateManagerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").optional(),
  email: z.string().email("Invalid email address").optional(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .optional(),
  phone: z.string().optional(),
  status: z.enum(["active", "inactive"]).optional(),
});

export type CreateManagerSchema = z.output<typeof createManagerSchema>;
export type UpdateManagerSchema = z.output<typeof updateManagerSchema>;
