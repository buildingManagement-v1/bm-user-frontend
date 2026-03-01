import { z } from "zod";

export const createParkingRegistrationSchema = z.object({
  tenantId: z.string().uuid("Please select a tenant"),
  unitId: z.string().uuid("Please select a unit"),
  licensePlate: z.string().min(1, "License plate is required").trim(),
});

export type CreateParkingRegistrationSchema = z.output<typeof createParkingRegistrationSchema>;
