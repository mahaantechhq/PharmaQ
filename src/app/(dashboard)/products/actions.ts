"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentBusiness } from "@/lib/supabase/current-business";
import { productSchema, type ProductFormValues } from "@/lib/validations/product";

function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function createProduct(values: ProductFormValues) {
  const ctx = await getCurrentBusiness();
  if (!ctx) throw new Error("Not authenticated");

  const parsed = productSchema.parse(values);
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("products")
    .insert({
      business_id: ctx.business.id,
      name: parsed.name,
      slug: `${slugify(parsed.name)}-${Date.now().toString(36)}`,
      category_id: parsed.category_id || null,
      brand_id: parsed.brand_id || null,
      manufacturer_id: parsed.manufacturer_id || null,
      composition: parsed.composition || null,
      pack_size: parsed.pack_size || null,
      hsn_code: parsed.hsn_code || null,
      gst_rate: parsed.gst_rate,
      status: parsed.status,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  const { error: batchError } = await supabase.from("product_batches").insert({
    product_id: data.id,
    business_id: ctx.business.id,
    batch_number: parsed.batch_number,
    mfg_date: parsed.mfg_date || null,
    expiry_date: parsed.expiry_date,
    mrp: parsed.mrp,
    selling_price: parsed.selling_price,
    scheme: parsed.scheme || null,
    discount_percent: parsed.discount_percent ?? null,
    stock_qty: parsed.stock_qty,
  });
  if (batchError) throw new Error(batchError.message);

  revalidatePath("/products");
  return data.id as string;
}

export async function updateProduct(productId: string, values: ProductFormValues, batchId?: string) {
  const ctx = await getCurrentBusiness();
  if (!ctx) throw new Error("Not authenticated");

  const parsed = productSchema.parse(values);
  const supabase = await createClient();

  const { error } = await supabase
    .from("products")
    .update({
      name: parsed.name,
      category_id: parsed.category_id || null,
      brand_id: parsed.brand_id || null,
      manufacturer_id: parsed.manufacturer_id || null,
      composition: parsed.composition || null,
      pack_size: parsed.pack_size || null,
      hsn_code: parsed.hsn_code || null,
      gst_rate: parsed.gst_rate,
      status: parsed.status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", productId)
    .eq("business_id", ctx.business.id);

  if (error) throw new Error(error.message);

  const batchFields = {
    batch_number: parsed.batch_number,
    mfg_date: parsed.mfg_date || null,
    expiry_date: parsed.expiry_date,
    mrp: parsed.mrp,
    selling_price: parsed.selling_price,
    scheme: parsed.scheme || null,
    discount_percent: parsed.discount_percent ?? null,
    stock_qty: parsed.stock_qty,
  };

  const { error: batchError } = batchId
    ? await supabase.from("product_batches").update(batchFields).eq("id", batchId).eq("business_id", ctx.business.id)
    : await supabase.from("product_batches").insert({ ...batchFields, product_id: productId, business_id: ctx.business.id });
  if (batchError) throw new Error(batchError.message);

  revalidatePath("/products");
  revalidatePath(`/products/${productId}`);
  revalidatePath("/inventory");
}

export async function bulkDeleteProducts(productIds: string[]) {
  const ctx = await getCurrentBusiness();
  if (!ctx) throw new Error("Not authenticated");
  if (productIds.length === 0) return { deleted: 0, blockedNames: [] as string[] };

  const supabase = await createClient();

  // Products with real order history can't be deleted -- supplier_order_items
  // has product_id references products(id) on delete restrict, so deleting
  // one would orphan that order's line item. A single batched DELETE would
  // fail entirely if any row hit this, so skip those up front instead.
  const { data: ordered } = await supabase
    .from("supplier_order_items")
    .select("product_id")
    .in("product_id", productIds);
  const blockedIds = new Set((ordered ?? []).map((o) => o.product_id));
  const deletableIds = productIds.filter((id) => !blockedIds.has(id));

  let blockedNames: string[] = [];
  if (blockedIds.size > 0) {
    const { data: blockedProducts } = await supabase
      .from("products")
      .select("name")
      .in("id", Array.from(blockedIds));
    blockedNames = (blockedProducts ?? []).map((p) => p.name);
  }

  if (deletableIds.length > 0) {
    const { error } = await supabase
      .from("products")
      .delete()
      .in("id", deletableIds)
      .eq("business_id", ctx.business.id);
    if (error) throw new Error(error.message);
  }
  revalidatePath("/products");
  revalidatePath("/inventory");

  return { deleted: deletableIds.length, blockedNames };
}

export async function bulkUpdateProductStatus(productIds: string[], status: "draft" | "active" | "inactive") {
  const ctx = await getCurrentBusiness();
  if (!ctx) throw new Error("Not authenticated");
  if (productIds.length === 0) return;

  const supabase = await createClient();
  const { error } = await supabase
    .from("products")
    .update({ status, updated_at: new Date().toISOString() })
    .in("id", productIds)
    .eq("business_id", ctx.business.id);

  if (error) throw new Error(error.message);
  revalidatePath("/products");
}

interface BulkProductRow {
  name: string;
  category?: string;
  composition?: string;
  pack_size?: string;
  hsn_code?: string;
  gst_rate?: string;
  batch_number?: string;
  expiry_date?: string;
  mrp?: string;
  selling_price?: string;
  scheme?: string;
  discount_percent?: string;
  stock_qty?: string;
}

// The bulk-upload template accepts DD-MM-YYYY or MM/YYYY (day omitted --
// pharma packs are commonly labelled with just month/year, taken to mean
// valid through the end of that month); ISO (YYYY-MM-DD) passes through
// unchanged so re-uploads of previously-exported data still work.
function parseExpiryDate(input: string): string {
  const trimmed = input.trim();
  const parts = trimmed.split(/[-/]/);
  if (parts.length === 3 && parts[0].length <= 2 && parts[2].length === 4) {
    const [d, m, y] = parts;
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  if (parts.length === 2 && parts[1].length === 4) {
    const [m, y] = parts;
    const lastDay = new Date(Number(y), Number(m), 0).getDate();
    return `${y}-${m.padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
  }
  return trimmed;
}

// gst_rate / discount_percent may be entered as "12%" or "12" — strip any
// "%" before parsing. Number("12%") is NaN, which supabase-js serializes
// to JSON `null`, silently tripping the not-null constraint on gst_rate.
function parsePercent(input: string): number {
  return Number(input.replace(/%/g, "").trim());
}

export async function bulkImportProducts(rows: BulkProductRow[]) {
  const ctx = await getCurrentBusiness();
  if (!ctx) throw new Error("Not authenticated");

  const supabase = await createClient();
  let created = 0;
  let restocked = 0;
  let skipped = 0;
  const errors: string[] = [];

  const [{ data: categories }, { data: existingProducts }, { data: existingBatches }] = await Promise.all([
    supabase.from("categories").select("id, name"),
    supabase.from("products").select("id, name").eq("business_id", ctx.business.id),
    supabase.from("product_batches").select("product_id, batch_number").eq("business_id", ctx.business.id),
  ]);
  const categoryMap = new Map((categories ?? []).map((c) => [c.name.toLowerCase(), c.id]));

  // Product names for this business (existing + created during this run)
  // map to their id, so repeated rows for the same product name in the CSV
  // (different batch numbers = restocking) attach a new batch to the one
  // product instead of being skipped or duplicated.
  const productIdByName = new Map((existingProducts ?? []).map((p) => [p.name.trim().toLowerCase(), p.id as string]));

  // (product_id, batch_number) pairs that already exist, so re-uploading
  // the exact same row twice is a genuine no-op skip.
  const existingBatchKeys = new Set(
    (existingBatches ?? []).map((b) => `${b.product_id}:${b.batch_number.trim().toLowerCase()}`),
  );

  for (const [index, row] of rows.entries()) {
    if (!row.name?.trim()) {
      errors.push(`Row ${index + 2}: missing product name`);
      continue;
    }

    const normalizedName = row.name.trim().toLowerCase();
    let productId = productIdByName.get(normalizedName);

    if (!productId) {
      const { data: product, error: productError } = await supabase
        .from("products")
        .insert({
          business_id: ctx.business.id,
          name: row.name.trim(),
          slug: `${slugify(row.name)}-${Date.now().toString(36)}-${index}`,
          category_id: row.category ? categoryMap.get(row.category.toLowerCase()) ?? null : null,
          composition: row.composition || null,
          pack_size: row.pack_size || null,
          hsn_code: row.hsn_code || null,
          gst_rate: row.gst_rate ? parsePercent(row.gst_rate) : 0,
          status: "active",
        })
        .select("id")
        .single();

      if (productError) {
        errors.push(`Row ${index + 2}: ${productError.message}`);
        continue;
      }

      productId = product.id as string;
      productIdByName.set(normalizedName, productId);
      created++;
    }

    if (!(row.batch_number && row.expiry_date && row.mrp && row.selling_price)) continue;

    const batchKey = `${productId}:${row.batch_number.trim().toLowerCase()}`;
    if (existingBatchKeys.has(batchKey)) {
      skipped++;
      errors.push(`Row ${index + 2}: batch "${row.batch_number}" for "${row.name.trim()}" already exists — skipped`);
      continue;
    }
    existingBatchKeys.add(batchKey);

    const { error: batchError } = await supabase.from("product_batches").insert({
      product_id: productId,
      business_id: ctx.business.id,
      batch_number: row.batch_number,
      expiry_date: parseExpiryDate(row.expiry_date),
      mrp: Number(row.mrp),
      selling_price: Number(row.selling_price),
      scheme: row.scheme || null,
      discount_percent: row.discount_percent ? parsePercent(row.discount_percent) : null,
      stock_qty: row.stock_qty ? Number(row.stock_qty) : 0,
    });
    if (batchError) {
      errors.push(`Row ${index + 2} (batch): ${batchError.message}`);
      continue;
    }
    restocked++;
  }

  revalidatePath("/products");
  revalidatePath("/inventory");

  return { created, restocked, skipped, errors };
}
