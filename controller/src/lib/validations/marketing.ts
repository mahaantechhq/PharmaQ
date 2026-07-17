import { z } from "zod";

export const couponSchema = z.object({
  code: z.string().min(3, "Code must be at least 3 characters").toUpperCase(),
  description: z.string().optional(),
  discount_type: z.enum(["percentage", "fixed"]),
  discount_value: z.number().positive("Must be greater than 0"),
  min_order_value: z.number().min(0),
  max_discount: z.number().optional(),
  valid_from: z.string().optional(),
  valid_until: z.string().optional(),
  usage_limit: z.number().int().optional(),
  status: z.enum(["active", "inactive"]),
});

export type CouponFormValues = z.infer<typeof couponSchema>;

export const bannerSchema = z.object({
  title: z.string().min(2, "Title is required"),
  image_url: z.string().url("Must be a valid URL"),
  link_url: z.string().optional(),
  position: z.enum(["hero", "category", "sidebar"]),
  sort_order: z.number().int().min(0),
  status: z.enum(["active", "inactive"]),
  starts_at: z.string().optional(),
  ends_at: z.string().optional(),
});

export type BannerFormValues = z.infer<typeof bannerSchema>;
