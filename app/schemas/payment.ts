import { z } from "zod";
import { PaymentType } from "~/types/payment";

export const createPaymentSchema = z.object({
  tenantId: z.string().uuid("Please select a tenant"),
  unitId: z.string().uuid("Please select a unit"),
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  type: z.nativeEnum(PaymentType),
  paymentDate: z.string().min(1, "Payment date is required"),
  monthsCovered: z.array(z.string()).optional(),
  notes: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.type === PaymentType.RENT && (data.monthsCovered?.length ?? 0) === 0) {
    ctx.addIssue({
      code: "custom",
      path: ["monthsCovered"],
      message: "Select at least one payment period",
    });
  }
});

export type CreatePaymentSchema = z.output<typeof createPaymentSchema>;
