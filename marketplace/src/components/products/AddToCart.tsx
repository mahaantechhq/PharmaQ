"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Minus, Plus, ShoppingCart, Heart } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { addToCart } from "@/app/(site)/cart/actions";
import { toggleWishlist } from "@/app/(site)/wishlist/actions";

export function AddToCart({
  productId,
  maxQty,
  isLoggedIn,
  initialWishlisted = false,
}: {
  productId: string;
  maxQty: number;
  isLoggedIn: boolean;
  initialWishlisted?: boolean;
}) {
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(false);
  const [wishlisted, setWishlisted] = useState(initialWishlisted);
  const router = useRouter();
  const { toast } = useToast();

  const outOfStock = maxQty <= 0;

  const handleAdd = async () => {
    if (!isLoggedIn) {
      router.push(`/login?next=/products/${productId}`);
      return;
    }
    setLoading(true);
    try {
      await addToCart(productId, qty);
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
      router.push(`/login?next=/products/${productId}`);
      return;
    }
    try {
      const nowWishlisted = await toggleWishlist(productId);
      setWishlisted(nowWishlisted);
      toast(nowWishlisted ? "Added to wishlist" : "Removed from wishlist", "success");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to update wishlist", "error");
    }
  };

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center rounded-lg border border-slate-200">
        <button
          onClick={() => setQty((q) => Math.max(1, q - 1))}
          className="flex h-11 w-11 items-center justify-center text-slate-500 hover:bg-slate-50"
        >
          <Minus className="h-4 w-4" />
        </button>
        <span className="w-10 text-center text-sm font-medium">{qty}</span>
        <button
          onClick={() => setQty((q) => Math.min(maxQty || 1, q + 1))}
          className="flex h-11 w-11 items-center justify-center text-slate-500 hover:bg-slate-50"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      <Button size="lg" onClick={handleAdd} loading={loading} disabled={outOfStock} className="flex-1">
        <ShoppingCart className="h-4 w-4" /> {outOfStock ? "Out of stock" : "Add to cart"}
      </Button>

      <button
        onClick={handleWishlist}
        className={`flex h-11 w-11 items-center justify-center rounded-lg border ${wishlisted ? "border-danger-200 bg-danger-50 text-danger-500" : "border-slate-200 text-slate-400 hover:bg-slate-50"}`}
      >
        <Heart className="h-4 w-4" fill={wishlisted ? "currentColor" : "none"} />
      </button>
    </div>
  );
}
