import { createClient } from "@/lib/supabase/server";
import type { Coupon } from "@/lib/types/database";

export interface CouponValidationResult {
  coupon: Coupon;
  discount: number;
}

export async function validateCoupon(code: string, subtotal: number): Promise<CouponValidationResult> {
  const supabase = await createClient();

  const { data: coupon } = await supabase
    .from("coupons")
    .select("*")
    .eq("code", code.toUpperCase().trim())
    .eq("status", "active")
    .maybeSingle();

  if (!coupon) throw new Error("Invalid or inactive coupon code");

  const today = new Date().toISOString().slice(0, 10);
  if (coupon.valid_from && coupon.valid_from > today) throw new Error("This coupon is not active yet");
  if (coupon.valid_until && coupon.valid_until < today) throw new Error("This coupon has expired");
  if (coupon.usage_limit != null && coupon.used_count >= coupon.usage_limit) throw new Error("This coupon has reached its usage limit");
  if (subtotal < Number(coupon.min_order_value)) {
    throw new Error(`Minimum order value for this coupon is ₹${Number(coupon.min_order_value).toLocaleString("en-IN")}`);
  }

  let discount =
    coupon.discount_type === "percentage" ? (subtotal * Number(coupon.discount_value)) / 100 : Number(coupon.discount_value);

  if (coupon.max_discount != null) discount = Math.min(discount, Number(coupon.max_discount));
  discount = Math.min(discount, subtotal);
  discount = Math.round(discount * 100) / 100;

  return { coupon: coupon as Coupon, discount };
}
