import { z } from "zod";
import { PaymentType } from "~/types/payment";

export const createPaymentRequestSchema = z.object({
  unitId: z.string().uuid("Please select a unit"),
  amount: z.number().positive("Amount must be greater than 0"),
  type: z.nativeEnum(PaymentType),
  paymentDate: z.string().min(1, "Payment date is required"),
  monthsCovered: z.array(z.string()).optional(),
  notes: z.string().optional(),
});

export type CreatePaymentRequestSchema = z.output<typeof createPaymentRequestSchema>;
