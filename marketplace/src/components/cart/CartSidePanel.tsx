"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Trash2 } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { Button } from "@/components/ui/Button";
import { removeCartItem, updateCartItemQuantity } from "@/app/(site)/cart/actions";
import { formatCurrency } from "@/lib/format";
import { useCart } from "@/components/cart/CartContext";
import type { CartLine } from "@/lib/checkout";

export function CartSidePanel() {
  const { summary, setSummary } = useCart();
  const { toast } = useToast();
  const [pendingId, setPendingId] = useState<string | null>(null);

  const handleQtyChange = async (line: CartLine, quantity: number) => {
    if (quantity < 1 || quantity > line.availableStock) return;
    setPendingId(line.cartItemId);
    try {
      const updated = await updateCartItemQuantity(line.cartItemId, quantity);
      setSummary(updated);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to update quantity", "error");
    } finally {
      setPendingId(null);
    }
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

  const bySupplier = new Map<string, { name: string; lines: CartLine[]; ptr: number; mrp: number; gst: number }>();
  for (const line of summary.lines) {
    const group = bySupplier.get(line.businessId) ?? { name: line.businessName, lines: [], ptr: 0, mrp: 0, gst: 0 };
    group.lines.push(line);
    group.ptr += line.lineTotal;
    group.mrp += line.mrp * line.quantity;
    group.gst += line.lineTax;
    bySupplier.set(line.businessId, group);
  }

  return (
    <div className="rounded-xl border border-slate-100 bg-white p-5">
      <p className="mb-3 text-sm font-semibold text-slate-800">Your cart</p>

      <div className="flex flex-col gap-5">
        {Array.from(bySupplier.entries()).map(([businessId, group]) => {
          const offer = summary.appliedOffers.find((o) => o.businessId === businessId);
          const discount = offer?.discountAmount ?? 0;
          const orderValue = Math.round((group.ptr - discount + group.gst) * 100) / 100;

          return (
            <div key={businessId} className="rounded-lg border border-slate-100">
              <p className="truncate border-b border-slate-100 px-3 py-2 text-xs font-semibold text-slate-600">{group.name}</p>

              <div className="flex flex-col divide-y divide-slate-50 px-3">
                {group.lines.map((line) => (
                  <div key={line.cartItemId} className="flex items-center justify-between gap-2 py-2.5">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-700">{line.productName}</p>
                      <div className="mt-0.5 flex items-center gap-3 text-[11px] text-slate-400">
                        <span>MRP {formatCurrency(line.mrp)}</span>
                        <span className="font-semibold text-slate-600">PTR {formatCurrency(line.unitPrice)}</span>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <div className="flex items-center rounded-lg border border-slate-200">
                        <button
                          disabled={pendingId === line.cartItemId}
                          onClick={() => handleQtyChange(line, line.quantity - 1)}
                          className="flex h-7 w-7 items-center justify-center text-slate-500 hover:bg-slate-50 disabled:opacity-40"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-7 text-center text-xs font-semibold text-slate-800">{line.quantity}</span>
                        <button
                          disabled={pendingId === line.cartItemId || line.quantity >= line.availableStock}
                          onClick={() => handleQtyChange(line, line.quantity + 1)}
                          className="flex h-7 w-7 items-center justify-center text-slate-500 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                      <button
                        disabled={pendingId === line.cartItemId}
                        onClick={() => handleRemove(line.cartItemId)}
                        aria-label={`Remove ${line.productName}`}
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-danger-50 hover:text-danger-500 disabled:opacity-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex flex-col gap-1 bg-slate-50 px-3 py-2.5 text-xs">
                <div className="flex justify-between text-slate-500">
                  <span>MRP</span>
                  <span>{formatCurrency(group.mrp)}</span>
                </div>
                <div className="flex justify-between font-medium text-success-600">
                  <span>PTR</span>
                  <span>{formatCurrency(group.ptr)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-success-600">
                    <span>Distributor Discount</span>
                    <span>-{formatCurrency(discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-500">
                  <span>GST</span>
                  <span>{formatCurrency(group.gst)}</span>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-1 font-semibold text-slate-900">
                  <span>Order Value</span>
                  <span>{formatCurrency(orderValue)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
        <div>
          {summary.discountTotal > 0 && (
            <p className="text-xs font-medium text-success-600">You saved {formatCurrency(summary.discountTotal)}</p>
          )}
          <p className="text-lg font-bold text-slate-900">{formatCurrency(summary.grandTotal)}</p>
          <p className="text-xs text-slate-400">
            {summary.supplierCount} Distributor{summary.supplierCount !== 1 && "s"} · {summary.lines.length} Item{summary.lines.length !== 1 && "s"}
          </p>
        </div>
        <Link href="/cart">
          <Button>View Cart</Button>
        </Link>
      </div>
    </div>
  );
}
