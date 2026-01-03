import { z } from "zod";

export const buildingSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  contactEmail: z.string().email("Invalid email").optional().or(z.literal("")),
  contactPhone: z.string().optional(),
  logoUrl: z.string().url("Invalid URL").optional().or(z.literal("")),
  settings: z.record(z.string(), z.any()).optional(),
});

export type BuildingSchema = z.output<typeof buildingSchema>;
