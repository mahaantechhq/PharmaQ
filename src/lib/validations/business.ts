import { z } from "zod";

export const businessProfileSchema = z.object({
  name: z.string().min(2, "Business name is required"),
  phone: z.string().optional(),
  email: z.string().email("Enter a valid email").optional().or(z.literal("")),
  gstin: z.string().optional(),
  drug_license_no: z.string().optional(),
  address_line1: z.string().optional(),
  address_line2: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().optional(),
});

export type BusinessProfileFormValues = z.infer<typeof businessProfileSchema>;
