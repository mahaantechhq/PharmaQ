"use client";

import { useState } from "react";
import Link from "next/link";
import { Minus, Plus, ShoppingCart, X } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { removeCartItem, updateCartItemQuantity } from "@/app/(site)/cart/actions";
import { formatCurrency } from "@/lib/format";
import { useCart } from "@/components/cart/CartContext";
import type { CartLine } from "@/lib/checkout";

export function CartSidePanel() {
  const { summary, setSummary } = useCart();
  const { toast } = useToast();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [qtyInputs, setQtyInputs] = useState<Record<string, string>>({});

  const handleQtyChange = async (cartItemId: string, quantity: number) => {
    setPendingId(cartItemId);
    try {
      const updated = await updateCartItemQuantity(cartItemId, quantity);
      setSummary(updated);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to update quantity", "error");
    } finally {
      setPendingId(null);
    }
  };

  const commitQtyInput = (line: CartLine) => {
    const raw = qtyInputs[line.cartItemId];
    setQtyInputs((prev) => {
      const next = { ...prev };
      delete next[line.cartItemId];
      return next;
    });
    if (raw === undefined) return;
    const clamped = Math.min(Math.max(1, parseInt(raw, 10) || 1), line.availableStock || 1);
    if (clamped !== line.quantity) handleQtyChange(line.cartItemId, clamped);
  };

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
          <div key={line.cartItemId} className="flex items-start justify-between gap-2 py-2.5">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-slate-700">{line.productName}</p>
              <p className="text-xs text-slate-400">{line.businessName}</p>
              <div className="mt-1.5 flex items-center rounded-lg border border-slate-200 w-fit">
                <button
                  disabled={pendingId === line.cartItemId}
                  onClick={() => handleQtyChange(line.cartItemId, line.quantity - 1)}
                  className="flex h-6 w-6 items-center justify-center text-slate-500 hover:bg-slate-50"
                  aria-label={`Decrease quantity of ${line.productName}`}
                >
                  <Minus className="h-3 w-3" />
                </button>
                <input
                  type="number"
                  min={1}
                  max={line.availableStock || 1}
                  disabled={pendingId === line.cartItemId}
                  value={qtyInputs[line.cartItemId] ?? String(line.quantity)}
                  onChange={(e) => setQtyInputs((prev) => ({ ...prev, [line.cartItemId]: e.target.value }))}
                  onBlur={() => commitQtyInput(line)}
                  onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
                  className="w-8 border-0 bg-transparent text-center text-xs font-medium focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                />
                <button
                  disabled={pendingId === line.cartItemId || line.quantity >= line.availableStock}
                  onClick={() => handleQtyChange(line.cartItemId, line.quantity + 1)}
                  className="flex h-6 w-6 items-center justify-center text-slate-500 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label={`Increase quantity of ${line.productName}`}
                >
                  <Plus className="h-3 w-3" />
                </button>
              </div>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1.5">
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
