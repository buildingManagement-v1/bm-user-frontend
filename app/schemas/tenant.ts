import { z } from "zod";
import { TenantStatus } from "~/types/tenant";

export const createTenantSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  unitId: z.string().uuid().optional(),
  status: z.nativeEnum(TenantStatus).optional(),
  password: z.string().min(6).optional(),
});

export const updateTenantSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  email: z.string().email("Invalid email address").optional(),
  phone: z.string().optional(),
  unitId: z.string().uuid().optional(),
  status: z.nativeEnum(TenantStatus).optional(),
});

export const onboardTenantSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .optional(),
  unitId: z.string().uuid("Unit is required"),
  leaseStartDate: z.string().min(1, "Start date is required"),
  leaseEndDate: z.string().min(1, "End date is required"),
  rentAmount: z.number().min(0, "Rent amount must be positive"),
  securityDeposit: z.number().min(0).optional(),
  notes: z.string().optional(),
});

export type OnboardTenantSchema = z.output<typeof onboardTenantSchema>;

export type CreateTenantSchema = z.output<typeof createTenantSchema>;
export type UpdateTenantSchema = z.output<typeof updateTenantSchema>;
