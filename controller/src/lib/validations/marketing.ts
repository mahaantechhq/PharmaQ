import { z } from "zod";

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
