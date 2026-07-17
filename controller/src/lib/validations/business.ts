import { z } from "zod";

export const createBusinessSchema = z
  .object({
    name: z.string().min(2, "Business name is required"),
    ownerName: z.string().min(2, "Owner name is required"),
    email: z.string().email("Enter a valid email"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(8, "Please confirm the password"),
    phone: z.string().optional(),
    gstin: z.string().optional(),
    drug_license_no: z.string().optional(),
    address_line1: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    pincode: z.string().optional(),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type CreateBusinessFormValues = z.infer<typeof createBusinessSchema>;

export const businessProfileSchema = z.object({
  name: z.string().min(2, "Business name is required"),
  phone: z.string().optional(),
  email: z.string().email("Enter a valid email").optional().or(z.literal("")),
  gstin: z.string().optional(),
  drug_license_no: z.string().optional(),
  address_line1: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().optional(),
});

export type BusinessProfileFormValues = z.infer<typeof businessProfileSchema>;
