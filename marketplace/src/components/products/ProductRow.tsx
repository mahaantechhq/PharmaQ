"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Heart, Package, Percent, Plus, Check, Gift, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { addToCart, updateCartItemQuantity } from "@/app/(site)/cart/actions";
import { toggleWishlist } from "@/app/(site)/wishlist/actions";
import { formatCurrency, hasScheme, parseScheme } from "@/lib/format";
import { highlightMatch } from "@/lib/highlight";
import { useCart } from "@/components/cart/CartContext";
import type { ProductListing } from "@/lib/marketplace";

export function ProductRow({
  product,
  isLoggedIn,
  initialWishlisted = false,
  query,
}: {
  product: ProductListing;
  isLoggedIn: boolean;
  initialWishlisted?: boolean;
  query?: string;
}) {
  const { summary, setSummary } = useCart();
  const cartLine = summary.lines.find((l) => l.productId === product.id);

  const [qty, setQty] = useState(cartLine ? String(cartLine.quantity) : "");
  const [loading, setLoading] = useState(false);
  const [wishlisted, setWishlisted] = useState(initialWishlisted);
  const [showSchemePopup, setShowSchemePopup] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const outOfStock = product.totalStock <= 0;
  const scheme = parseScheme(product.scheme);

  const submitQuantity = async (quantity: number) => {
    if (!isLoggedIn) {
      router.push(`/login?next=/search`);
      return;
    }
    setLoading(true);
    try {
      const updated = cartLine
        ? await updateCartItemQuantity(cartLine.cartItemId, quantity)
        : await addToCart(product.id, quantity);
      setSummary(updated);
      const newLine = updated.lines.find((l) => l.productId === product.id);
      setQty(newLine ? String(newLine.quantity) : String(quantity));
      toast(cartLine ? "Cart updated" : "Added to cart", "success");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to add to cart", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const quantity = Math.max(1, parseInt(qty, 10) || 1);
    await submitQuantity(quantity);
  };

  const handleGetScheme = async () => {
    if (!scheme) return;
    setShowSchemePopup(false);
    setQty(String(scheme.buy));
    await submitQuantity(scheme.buy);
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
    <form onSubmit={handleAdd} className="relative flex items-center gap-4 border-b border-slate-100 px-4 py-4 last:border-b-0 sm:px-5">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Link href={`/products/${product.id}`} className="truncate text-sm font-semibold text-slate-800 hover:text-primary-600">
            {highlightMatch(product.name, query)}
          </Link>
          {cartLine && (
            <span className="flex shrink-0 items-center gap-1 rounded-full bg-success-50 px-2 py-0.5 text-[11px] font-semibold text-success-600">
              <Check className="h-3 w-3" /> Added
            </span>
          )}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
          <Link href={`/suppliers/${product.businessId}`} className="font-medium text-primary-600 hover:underline">
            {product.businessName}
          </Link>
          {product.brandName && <span className="text-slate-600">{product.brandName}</span>}
          {product.packSize && <span className="font-semibold text-slate-600">{product.packSize}</span>}
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
            <Package className="h-3 w-3" />{" "}
            {outOfStock ? "Out of stock" : <span className="font-semibold">{product.totalStock} in stock</span>}
          </span>
        </div>
      </div>

      {hasScheme(product.scheme) && (
        <span className="shrink-0 rounded-md bg-accent-50 px-2 py-1 text-xs font-semibold text-accent-600">{product.scheme}</span>
      )}

      <button
        type="button"
        onClick={handleWishlist}
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${wishlisted ? "text-danger-500" : "text-slate-300 hover:bg-slate-50 hover:text-slate-400"}`}
        aria-label="Toggle wishlist"
      >
        <Heart className="h-4 w-4" fill={wishlisted ? "currentColor" : "none"} />
      </button>

      <input
        type="number"
        min={1}
        max={product.totalStock || 1}
        required
        value={qty}
        onChange={(e) => {
          setQty(e.target.value);
          setShowSchemePopup(false);
          e.target.setCustomValidity("");
        }}
        onInvalid={(e) => (e.target as HTMLInputElement).setCustomValidity("Please enter a quantity!")}
        onBlur={() => {
          if (qty === "") return;
          const clamped = Math.min(Math.max(1, parseInt(qty, 10) || 1), product.totalStock || 1);
          setQty(String(clamped));
          setShowSchemePopup(!!scheme && clamped < scheme.buy && scheme.buy <= product.totalStock);
        }}
        placeholder="Qty"
        disabled={outOfStock}
        className={`h-10 w-16 shrink-0 rounded-lg border px-2 text-center text-sm font-medium disabled:bg-slate-50 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none ${
          cartLine ? "border-primary-300 bg-primary-50 text-primary-700" : "border-slate-200"
        }`}
      />

      <Button type="submit" size="icon" loading={loading} disabled={outOfStock} className="shrink-0" aria-label={cartLine ? "Update quantity" : "Add to cart"}>
        <Plus className="h-4 w-4" />
      </Button>

      {showSchemePopup && scheme && (
        <div className="absolute left-4 right-4 top-full z-20 mt-2 rounded-xl border border-slate-100 bg-white p-4 shadow-lg sm:left-5 sm:right-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-success-50 text-success-600">
                <Gift className="h-4 w-4" />
              </span>
              <span className="text-sm font-semibold text-slate-800">Get Scheme</span>
            </div>
            <button type="button" onClick={() => setShowSchemePopup(false)} aria-label="Dismiss" className="text-slate-400 hover:text-slate-600">
              <X className="h-4 w-4" />
            </button>
          </div>
          <p className="mt-3 rounded-lg bg-success-50 px-3 py-2 text-sm text-success-700">
            Order {scheme.buy - Math.max(1, parseInt(qty, 10) || 1)} more and get {scheme.free} free
          </p>
          <Button type="button" onClick={handleGetScheme} loading={loading} className="mt-3 w-full">
            <Plus className="h-4 w-4" /> Add
          </Button>
        </div>
      )}
    </form>
  );
}
