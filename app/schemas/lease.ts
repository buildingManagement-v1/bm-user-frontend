import { z } from "zod";
import { LeaseStatus } from "~/types/lease";

export const createLeaseSchema = z.object({
  tenantId: z.string().uuid("Invalid tenant"),
  unitId: z.string().uuid("Invalid unit"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  rentAmount: z.coerce.number().positive("Rent amount must be greater than 0"),
  securityDeposit: z.coerce.number().positive().optional().or(z.literal("")),
  carsAllowed: z.coerce.number().int().min(0).optional().or(z.literal("")),
  status: z.nativeEnum(LeaseStatus).optional(),
});

export const updateLeaseSchema = z.object({
  startDate: z.string().min(1, "Start date is required").optional(),
  endDate: z.string().min(1, "End date is required").optional(),
  rentAmount: z.coerce
    .number()
    .positive("Rent amount must be greater than 0")
    .optional(),
  securityDeposit: z.coerce
    .number()
    .positive()
    .optional()
    .or(z.literal(""))
    .or(z.undefined()),
  carsAllowed: z.coerce.number().int().min(0).optional().or(z.literal("")).or(z.undefined()),
  status: z.nativeEnum(LeaseStatus).optional(),
});

export type CreateLeaseSchema = z.output<typeof createLeaseSchema>;
export type UpdateLeaseSchema = z.output<typeof updateLeaseSchema>;
