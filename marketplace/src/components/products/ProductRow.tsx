"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Heart, Package, Percent } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { addToCart } from "@/app/(site)/cart/actions";
import { toggleWishlist } from "@/app/(site)/wishlist/actions";
import { formatCurrency } from "@/lib/format";
import type { ProductListing } from "@/lib/marketplace";

export function ProductRow({
  product,
  isLoggedIn,
  initialWishlisted = false,
}: {
  product: ProductListing;
  isLoggedIn: boolean;
  initialWishlisted?: boolean;
}) {
  const [qty, setQty] = useState("1");
  const [loading, setLoading] = useState(false);
  const [wishlisted, setWishlisted] = useState(initialWishlisted);
  const router = useRouter();
  const { toast } = useToast();

  const outOfStock = product.totalStock <= 0;

  const handleAdd = async () => {
    if (!isLoggedIn) {
      router.push(`/login?next=/search`);
      return;
    }
    const quantity = Math.max(1, parseInt(qty, 10) || 1);
    setLoading(true);
    try {
      await addToCart(product.id, quantity);
      toast("Added to cart", "success");
      router.refresh();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to add to cart", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleWishlist = async () => {
    if (!isLoggedIn) {
      router.push(`/login?next=/search`);
      return;
    }
    try {
      const nowWishlisted = await toggleWishlist(product.id);
      setWishlisted(nowWishlisted);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to update wishlist", "error");
    }
  };

  return (
    <div className="flex items-center gap-4 border-b border-slate-100 px-4 py-4 last:border-b-0 sm:px-5">
      <div className="min-w-0 flex-1">
        <Link href={`/products/${product.id}`} className="truncate text-sm font-semibold text-slate-800 hover:text-primary-600">
          {product.name}
        </Link>
        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
          <Link href={`/suppliers/${product.businessId}`} className="font-medium text-primary-600 hover:underline">
            {product.businessName}
          </Link>
          {product.brandName && <span className="text-slate-400">{product.brandName}</span>}
          {product.packSize && <span className="text-slate-400">{product.packSize}</span>}
        </div>
        {product.offer && (
          <p className="mt-1 flex items-center gap-1 text-xs font-medium text-accent-600">
            <Percent className="h-3 w-3" />
            {product.offer.discountType === "percentage" ? `${product.offer.discountValue}% OFF` : `₹${product.offer.discountValue} OFF`} — {product.offer.displayText}
          </p>
        )}
        <div className="mt-1.5 flex items-center gap-3 text-xs text-slate-500">
          {product.minPrice != null ? (
            <span className="text-sm font-semibold text-slate-900">{formatCurrency(product.minPrice)}</span>
          ) : (
            <span className="text-slate-400">Price on request</span>
          )}
          {product.mrp != null && product.mrp > (product.minPrice ?? 0) && (
            <span className="text-slate-400 line-through">{formatCurrency(product.mrp)}</span>
          )}
          <span className={`flex items-center gap-1 ${outOfStock ? "text-danger-500" : "text-success-600"}`}>
            <Package className="h-3 w-3" /> {outOfStock ? "Out of stock" : `${product.totalStock} in stock`}
          </span>
        </div>
      </div>

      <button
        onClick={handleWishlist}
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${wishlisted ? "text-danger-500" : "text-slate-300 hover:bg-slate-50 hover:text-slate-400"}`}
        aria-label="Toggle wishlist"
      >
        <Heart className="h-4 w-4" fill={wishlisted ? "currentColor" : "none"} />
      </button>

      <input
        type="number"
        min={1}
        value={qty}
        onChange={(e) => setQty(e.target.value)}
        disabled={outOfStock}
        className="h-10 w-16 shrink-0 rounded-lg border border-slate-200 px-2 text-center text-sm disabled:bg-slate-50"
      />

      <Button onClick={handleAdd} loading={loading} disabled={outOfStock} className="shrink-0">
        {outOfStock ? "Unavailable" : "Add"}
      </Button>
    </div>
  );
}
