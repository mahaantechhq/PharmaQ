import { z } from "zod";

export const productSchema = z.object({
  name: z.string().min(2, "Name is required"),
  category_id: z.string().uuid().optional().or(z.literal("")),
  brand_id: z.string().uuid().optional().or(z.literal("")),
  manufacturer_id: z.string().uuid().optional().or(z.literal("")),
  composition: z.string().optional(),
  pack_size: z.string().optional(),
  hsn_code: z.string().optional(),
  gst_rate: z.number().min(0).max(28),
  description: z.string().optional(),
  status: z.enum(["draft", "active", "inactive"]),
});

export type ProductFormValues = z.infer<typeof productSchema>;

export const batchSchema = z.object({
  batch_number: z.string().min(1, "Batch number is required"),
  mfg_date: z.string().optional(),
  expiry_date: z.string().min(1, "Expiry date is required"),
  mrp: z.number().positive("MRP must be greater than 0"),
  selling_price: z.number().positive("Selling price must be greater than 0"),
  stock_qty: z.number().int().min(0, "Stock cannot be negative"),
});

export type BatchFormValues = z.infer<typeof batchSchema>;
