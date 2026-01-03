import { z } from "zod";
import { UnitType, UnitStatus } from "~/types/unit";

export const createUnitSchema = z.object({
  unitNumber: z.string().min(1, "Unit number is required"),
  floor: z.number().int().optional(),
  size: z.number().positive().optional(),
  type: z.nativeEnum(UnitType).optional(),
  rentPrice: z.number().positive("Rent price must be greater than 0"),
  status: z.nativeEnum(UnitStatus).optional(),
});

export const updateUnitSchema = z.object({
  unitNumber: z.string().min(1, "Unit number is required").optional(),
  floor: z.number().int().optional(),
  size: z.number().positive().optional(),
  type: z.nativeEnum(UnitType).optional(),
  rentPrice: z
    .number()
    .positive("Rent price must be greater than 0")
    .optional(),
  status: z.nativeEnum(UnitStatus).optional(),
});

export type CreateUnitSchema = z.output<typeof createUnitSchema>;
export type UpdateUnitSchema = z.output<typeof updateUnitSchema>;
