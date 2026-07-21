import { z } from "zod";

export const offerSchema = z.object({
  name: z.string().min(2, "Offer name is required").max(50),
  display_text: z.string().min(2, "Display text is required").max(250),
  discount_type: z.enum(["flat", "percentage"]),
  discount_value: z.number().positive("Must be greater than 0"),
  min_order_amount: z.number().min(0),
  max_order_amount: z.number().optional(),
  starts_at: z.string().optional(),
  expires_at: z.string().min(1, "Expiry date is required"),
  status: z.enum(["active", "inactive"]),
});

export type OfferFormValues = z.infer<typeof offerSchema>;
