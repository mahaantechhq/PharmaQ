import type { OfferSummary } from "@/lib/offers";

export interface ProductListing {
  id: string;
  name: string;
  composition: string | null;
  packSize: string | null;
  gstRate: number;
  categoryName: string | null;
  brandName: string | null;
  businessId: string;
  businessName: string;
  businessCity: string | null;
  totalStock: number;
  minPrice: number | null;
  mrp: number | null;
  createdAt: string;
  offer?: OfferSummary | null;
}
