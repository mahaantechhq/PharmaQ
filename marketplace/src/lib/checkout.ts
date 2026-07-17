import { createClient } from "@/lib/supabase/server";

export interface CartLine {
  cartItemId: string;
  productId: string;
  productName: string;
  packSize: string | null;
  businessId: string;
  businessName: string;
  quantity: number;
  unitPrice: number;
  gstRate: number;
  lineTotal: number;
  availableStock: number;
  batchNumber: string | null;
  batchId: string | null;
}

export interface CartSummary {
  lines: CartLine[];
  subtotal: number;
  taxTotal: number;
  grandTotal: number;
  supplierCount: number;
}

export async function getCartSummary(buyerBusinessId: string): Promise<CartSummary> {
  const supabase = await createClient();

  const { data: cartItems } = await supabase
    .from("cart_items")
    .select("id, product_id, quantity")
    .eq("buyer_business_id", buyerBusinessId);

  if (!cartItems || cartItems.length === 0) {
    return { lines: [], subtotal: 0, taxTotal: 0, grandTotal: 0, supplierCount: 0 };
  }

  const productIds = cartItems.map((c) => c.product_id);

  const [{ data: products }, { data: batches }] = await Promise.all([
    supabase
      .from("products")
      .select("id, name, pack_size, gst_rate, status, business_id, businesses:business_id(name)")
      .in("id", productIds),
    supabase
      .from("product_batches")
      .select("id, product_id, batch_number, stock_qty, selling_price, expiry_date")
      .in("product_id", productIds)
      .gt("stock_qty", 0)
      .order("expiry_date", { ascending: true }),
  ]);

  const today = new Date().toISOString().slice(0, 10);
  const bestBatchByProduct = new Map<string, { id: string; batch_number: string; selling_price: number }>();
  const stockByProduct = new Map<string, number>();
  for (const b of batches ?? []) {
    if (b.expiry_date < today) continue;
    stockByProduct.set(b.product_id, (stockByProduct.get(b.product_id) ?? 0) + b.stock_qty);
    if (!bestBatchByProduct.has(b.product_id)) {
      bestBatchByProduct.set(b.product_id, { id: b.id, batch_number: b.batch_number, selling_price: Number(b.selling_price) });
    }
  }

  const productMap = new Map((products ?? []).map((p: any) => [p.id, p]));

  const lines: CartLine[] = cartItems
    .filter((c) => productMap.has(c.product_id) && productMap.get(c.product_id).status === "active")
    .map((c) => {
      const product = productMap.get(c.product_id);
      const bestBatch = bestBatchByProduct.get(c.product_id);
      const unitPrice = bestBatch?.selling_price ?? 0;
      const lineTotal = Math.round(unitPrice * c.quantity * 100) / 100;
      return {
        cartItemId: c.id,
        productId: c.product_id,
        productName: product.name,
        packSize: product.pack_size,
        businessId: product.business_id,
        businessName: product.businesses?.name ?? "Unknown supplier",
        quantity: c.quantity,
        unitPrice,
        gstRate: Number(product.gst_rate),
        lineTotal,
        availableStock: stockByProduct.get(c.product_id) ?? 0,
        batchNumber: bestBatch?.batch_number ?? null,
        batchId: bestBatch?.id ?? null,
      };
    });

  const subtotal = Math.round(lines.reduce((sum, l) => sum + l.lineTotal, 0) * 100) / 100;
  const taxTotal = Math.round(lines.reduce((sum, l) => sum + (l.lineTotal * l.gstRate) / 100, 0) * 100) / 100;
  const grandTotal = Math.round((subtotal + taxTotal) * 100) / 100;
  const supplierCount = new Set(lines.map((l) => l.businessId)).size;

  return { lines, subtotal, taxTotal, grandTotal, supplierCount };
}
