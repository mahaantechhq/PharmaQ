"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { X } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { Button } from "@/components/ui/Button";
import { removeCartItem } from "@/app/(site)/cart/actions";
import { formatCurrency } from "@/lib/format";
import { useCart } from "@/components/cart/CartContext";
import type { CartLine } from "@/lib/checkout";

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
      <div className="flex h-full flex-col rounded-xl border border-slate-100 bg-white p-5">
        <p className="mb-3 text-center text-base font-semibold text-slate-800">Cart</p>
        <div className="flex flex-1 flex-col items-center justify-center gap-2 py-4 text-center">
          <Image src="/empty-cart.png" alt="" width={1200} height={831} className="h-auto w-40" />
          <p className="mt-2 text-base font-semibold text-slate-800">No Items in Cart</p>
          <p className="text-sm text-slate-400">Add products to place order</p>
        </div>
      </div>
    );
  }

  const bySupplier = new Map<string, { name: string; lines: CartLine[]; total: number }>();
  for (const line of summary.lines) {
    const group = bySupplier.get(line.businessId) ?? { name: line.businessName, lines: [], total: 0 };
    group.lines.push(line);
    group.total += line.lineTotal;
    bySupplier.set(line.businessId, group);
  }

  return (
    <div className="rounded-xl border border-slate-100 bg-white p-5">
      <p className="mb-3 text-sm font-semibold text-slate-800">Your cart</p>

      <div className="flex flex-col gap-4">
        {Array.from(bySupplier.entries()).map(([businessId, group]) => (
          <div key={businessId}>
            <div className="mb-1.5 flex items-center justify-between">
              <p className="truncate text-xs font-semibold text-slate-500">{group.name}</p>
              <p className="text-xs font-semibold text-slate-700">{formatCurrency(group.total)}</p>
            </div>
            <div className="flex flex-col divide-y divide-slate-50">
              {group.lines.map((line) => (
                <div key={line.cartItemId} className="flex items-center justify-between gap-2 py-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-700">{line.productName}</p>
                    <p className="text-xs text-slate-400">Qty {line.quantity}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="text-xs font-medium text-slate-400">×{line.quantity}</span>
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
          </div>
        ))}
      </div>

      <div className="mt-4 border-t border-slate-100 pt-3">
        <div className="flex flex-col gap-1 text-xs">
          <div className="flex justify-between text-slate-500">
            <span>Total</span>
            <span>{formatCurrency(summary.subtotal)}</span>
          </div>
          {summary.discountTotal > 0 && (
            <div className="flex justify-between text-success-600">
              <span>Discount</span>
              <span>-{formatCurrency(summary.discountTotal)}</span>
            </div>
          )}
          <div className="flex justify-between border-t border-slate-100 pt-1 text-sm font-bold text-slate-900">
            <span>After discount</span>
            <span>{formatCurrency(summary.grandTotal)}</span>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between">
          <p className="text-xs text-slate-400">
            {summary.supplierCount} Distributor{summary.supplierCount !== 1 && "s"} · {summary.lines.length} Item{summary.lines.length !== 1 && "s"}
          </p>
          <Link href="/cart">
            <Button>View Cart</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
