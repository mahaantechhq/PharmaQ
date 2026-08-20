"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type { CartSummary } from "@/lib/checkout";

const EMPTY_SUMMARY: CartSummary = {
  lines: [],
  subtotal: 0,
  discountTotal: 0,
  taxTotal: 0,
  grandTotal: 0,
  supplierCount: 0,
  appliedOffers: [],
};

export interface LastAdded {
  productName: string;
  packSize: string | null;
  quantity: number;
}

interface CartContextValue {
  summary: CartSummary;
  count: number;
  setSummary: (summary: CartSummary) => void;
  lastAdded: LastAdded | null;
  setLastAdded: (info: LastAdded) => void;
}

const CartContext = createContext<CartContextValue | null>(null);

// Seeded server-side from the (site) layout and kept live entirely on the
// client from then on -- cart mutations update this directly from the
// server action's return value instead of router.refresh(), which used to
// reload the whole current page (search results, supplier catalog, etc.)
// just to reflect a quantity change. This context persists across
// client-side navigation since it lives in the shared layout.
export function CartProvider({ initialSummary, children }: { initialSummary: CartSummary | null; children: ReactNode }) {
  const [summary, setSummary] = useState<CartSummary>(initialSummary ?? EMPTY_SUMMARY);
  const [lastAdded, setLastAdded] = useState<LastAdded | null>(null);
  const count = useMemo(() => summary.lines.reduce((sum, l) => sum + l.quantity, 0), [summary.lines]);

  const value = useMemo(() => ({ summary, count, setSummary, lastAdded, setLastAdded }), [summary, count, lastAdded]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
