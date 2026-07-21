"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { updateCartItemQuantity, removeCartItem } from "@/app/(site)/cart/actions";
import { formatCurrency } from "@/lib/format";
import type { CartLine } from "@/lib/checkout";

export function CartTable({ lines, subtotal, taxTotal, grandTotal, supplierCount }: {
  lines: CartLine[];
  subtotal: number;
  taxTotal: number;
  grandTotal: number;
  supplierCount: number;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [pendingId, setPendingId] = useState<string | null>(null);

  const handleQtyChange = async (cartItemId: string, quantity: number) => {
    setPendingId(cartItemId);
    try {
      await updateCartItemQuantity(cartItemId, quantity);
      router.refresh();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to update quantity", "error");
    } finally {
      setPendingId(null);
    }
  };

  const handleRemove = async (cartItemId: string) => {
    setPendingId(cartItemId);
    try {
      await removeCartItem(cartItemId);
      toast("Removed from cart", "success");
      router.refresh();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to remove item", "error");
    } finally {
      setPendingId(null);
    }
  };

  const bySupplier = new Map<string, { name: string; lines: CartLine[] }>();
  for (const line of lines) {
    const existing = bySupplier.get(line.businessId) ?? { name: line.businessName, lines: [] };
    existing.lines.push(line);
    bySupplier.set(line.businessId, existing);
  }

  if (lines.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-24 text-slate-400">
        <ShoppingBag className="h-10 w-10" />
        <p className="text-sm">Your cart is empty.</p>
        <Link href="/search">
          <Button variant="outline">Browse products</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_340px]">
      <div className="flex flex-col gap-6">
        {Array.from(bySupplier.entries()).map(([businessId, group]) => (
          <div key={businessId} className="rounded-xl border border-slate-100 bg-white">
            <div className="border-b border-slate-100 px-5 py-3">
              <p className="text-sm font-semibold text-slate-800">{group.name}</p>
              <p className="text-xs text-slate-400">This will be a separate order</p>
            </div>
            <div className="flex flex-col divide-y divide-slate-50">
              {group.lines.map((line) => (
                <div key={line.cartItemId} className="flex items-center gap-4 px-5 py-4">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-800">{line.productName}</p>
                    {line.packSize && <p className="text-xs text-slate-400">{line.packSize}</p>}
                    {line.quantity > line.availableStock && (
                      <p className="mt-1 text-xs text-danger-500">Only {line.availableStock} units available</p>
                    )}
                  </div>
                  <div className="flex items-center rounded-lg border border-slate-200">
                    <button
                      disabled={pendingId === line.cartItemId}
                      onClick={() => handleQtyChange(line.cartItemId, line.quantity - 1)}
                      className="flex h-9 w-9 items-center justify-center text-slate-500 hover:bg-slate-50"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="w-8 text-center text-sm font-medium">{line.quantity}</span>
                    <button
                      disabled={pendingId === line.cartItemId}
                      onClick={() => handleQtyChange(line.cartItemId, line.quantity + 1)}
                      className="flex h-9 w-9 items-center justify-center text-slate-500 hover:bg-slate-50"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <span className="w-24 text-right text-sm font-semibold text-slate-800">{formatCurrency(line.lineTotal)}</span>
                  <button
                    disabled={pendingId === line.cartItemId}
                    onClick={() => handleRemove(line.cartItemId)}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-danger-50 hover:text-danger-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="h-fit rounded-xl border border-slate-100 bg-white p-5">
        <p className="mb-4 text-sm font-semibold text-slate-800">Order summary</p>

        <div className="flex flex-col gap-2 text-sm">
          <div className="flex justify-between text-slate-500">
            <span>Subtotal ({lines.length} items)</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex justify-between text-slate-500">
            <span>Tax</span>
            <span>{formatCurrency(taxTotal)}</span>
          </div>
          <div className="flex justify-between border-t border-slate-100 pt-2 text-base font-semibold text-slate-900">
            <span>Total</span>
            <span>{formatCurrency(grandTotal)}</span>
          </div>
        </div>

        <p className="mt-3 text-xs text-slate-400">
          Splitting into {supplierCount} order{supplierCount !== 1 && "s"} across {supplierCount} supplier{supplierCount !== 1 && "s"}
        </p>

        <Link href="/checkout" className="mt-4 block">
          <Button size="lg" className="w-full">Proceed to checkout</Button>
        </Link>
      </div>
    </div>
  );
}
