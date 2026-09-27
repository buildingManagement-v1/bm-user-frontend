import { z } from "zod";
import { UnitType, UnitStatus } from "~/types/unit";

export const createUnitSchema = z.object({
  unitNumber: z.string().min(1, "Unit number is required"),
  floor: z.coerce.number().int().optional(),
  size: z.coerce.number().min(0).optional(),
  type: z.nativeEnum(UnitType).optional(),
  rentPrice: z.coerce.number().positive("Rent price must be greater than 0"),
  status: z.enum([UnitStatus.VACANT, UnitStatus.INACTIVE]).optional(),
});

export const updateUnitSchema = z.object({
  unitNumber: z.string().min(1, "Unit number is required").optional(),
  floor: z.coerce.number().int().optional(),
  size: z.coerce.number().min(0).optional(),
  type: z.nativeEnum(UnitType).optional(),
  rentPrice: z.coerce
    .number()
    .positive("Rent price must be greater than 0")
    .optional(),
  status: z.enum([UnitStatus.VACANT, UnitStatus.INACTIVE]).optional(),
});

export type CreateUnitSchema = z.output<typeof createUnitSchema>;
export type UpdateUnitSchema = z.output<typeof updateUnitSchema>;
