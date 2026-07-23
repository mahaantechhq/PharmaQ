import { z } from "zod";

export const offerSchema = z
  .object({
    name: z.string().min(2, "Offer name is required").max(50),
    display_text: z.string().min(2, "Display text is required").max(250),
    discount_type: z.enum(["flat", "percentage"]),
    discount_value: z.number().positive("Must be greater than 0"),
    min_order_amount: z.number().min(0),
    max_order_amount: z.number().optional(),
    starts_at: z.string().optional(),
    expires_at: z.string().min(1, "Expiry date is required"),
    status: z.enum(["active", "inactive"]),
  })
  .refine((v) => v.discount_type !== "percentage" || v.discount_value <= 100, {
    message: "Percentage discount cannot exceed 100%",
    path: ["discount_value"],
  })
  .refine((v) => v.max_order_amount == null || v.max_order_amount > v.min_order_amount, {
    message: "Maximum order amount must be greater than minimum order amount",
    path: ["max_order_amount"],
  })
  .refine((v) => !v.starts_at || v.expires_at >= v.starts_at, {
    message: "Expiry date must be on or after the start date",
    path: ["expires_at"],
  });

export type OfferFormValues = z.infer<typeof offerSchema>;
