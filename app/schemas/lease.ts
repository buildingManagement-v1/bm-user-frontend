import { z } from "zod";

const optionalMoney = z.coerce.number().min(0).optional().or(z.literal(""));
const optionalCount = z.coerce.number().int().min(0).optional().or(z.literal(""));

/** Mirrors CreateLeaseDto (status is set by the server) */
export const createLeaseSchema = z
  .object({
    tenantId: z.string().uuid("Invalid tenant"),
    unitId: z.string().uuid("Select a unit"),
    startDate: z.string().min(1, "Start date is required"),
    endDate: z.string().min(1, "End date is required"),
    rentAmount: z.coerce.number().positive("Rent amount must be greater than 0"),
    securityDeposit: optionalMoney,
    carsAllowed: optionalCount,
    useDefaultPaymentDay: z.boolean(),
    paymentCollectionDay: z.coerce.number().int().min(1).max(31).optional(),
    applyWithholding: z.boolean(),
  })
  .superRefine((data, ctx) => {
    if (data.startDate && data.endDate && data.endDate <= data.startDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["endDate"],
        message: "End date must be after the start date",
      });
    }
    if (!data.useDefaultPaymentDay && !data.paymentCollectionDay) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["paymentCollectionDay"],
        message: "Choose a payment day",
      });
    }
  });

/** Mirrors TerminateLeaseDto */
export const terminateLeaseSchema = z.object({
  effectiveDate: z.string().min(1, "Choose the last day of the tenancy"),
  reason: z.string().max(500).optional(),
});

export type CreateLeaseSchema = z.output<typeof createLeaseSchema>;
export type TerminateLeaseSchema = z.output<typeof terminateLeaseSchema>;
