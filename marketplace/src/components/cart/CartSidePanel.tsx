"use client";

import { useState } from "react";
import Link from "next/link";
import { ShoppingCart, X } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { removeCartItem } from "@/app/(site)/cart/actions";
import { formatCurrency } from "@/lib/format";
import { useCart } from "@/components/cart/CartContext";

export function CartSidePanel() {
  const { summary, setSummary } = useCart();
  const { toast } = useToast();
  const [pendingId, setPendingId] = useState<string | null>(null);

  const handleRemove = async (cartItemId: string) => {
    setPendingId(cartItemId);
    try {
      const updated = await removeCartItem(cartItemId);
      setSummary(updated);
      toast("Removed from cart", "success");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to remove item", "error");
    } finally {
      setPendingId(null);
    }
  };

  if (summary.lines.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 rounded-xl border border-slate-100 bg-white p-8 text-center">
        <ShoppingCart className="h-10 w-10 text-primary-300" />
        <p className="text-base font-semibold text-slate-800">Your cart is empty!</p>
        <p className="text-sm text-slate-400">You don&apos;t have any products in the cart.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-100 bg-white p-5">
      <p className="mb-3 text-sm font-semibold text-slate-800">Your cart</p>
      <div className="flex flex-col divide-y divide-slate-50">
        {summary.lines.map((line) => (
          <div key={line.cartItemId} className="flex items-center justify-between gap-2 py-2.5">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-slate-700">{line.productName}</p>
              <p className="text-xs text-slate-400">Qty {line.quantity} · {line.businessName}</p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <span className="text-sm font-semibold text-slate-800">{formatCurrency(line.lineTotal)}</span>
              <button
                disabled={pendingId === line.cartItemId}
                onClick={() => handleRemove(line.cartItemId)}
                aria-label={`Remove ${line.productName}`}
                className="flex h-6 w-6 items-center justify-center rounded-full text-danger-500 hover:bg-danger-50 disabled:opacity-50"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 text-sm">
        <span className="text-slate-500">Total ({summary.lines.length} item{summary.lines.length !== 1 && "s"})</span>
        <span className="font-semibold text-slate-900">{formatCurrency(summary.grandTotal)}</span>
      </div>
      <Link href="/cart" className="mt-4 block rounded-lg bg-primary-600 py-2.5 text-center text-sm font-semibold text-white hover:bg-primary-700">
        View cart
      </Link>
    </div>
  );
}
