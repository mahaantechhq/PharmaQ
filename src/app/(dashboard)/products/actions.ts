"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentBusiness } from "@/lib/supabase/current-business";
import { productSchema, batchSchema, type ProductFormValues, type BatchFormValues } from "@/lib/validations/product";

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
      description: parsed.description || null,
      status: parsed.status,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  revalidatePath("/products");
  return data.id as string;
}

export async function updateProduct(productId: string, values: ProductFormValues) {
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
      description: parsed.description || null,
      status: parsed.status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", productId)
    .eq("business_id", ctx.business.id);

  if (error) throw new Error(error.message);

  revalidatePath("/products");
  revalidatePath(`/products/${productId}`);
}

export async function deleteProduct(productId: string) {
  const ctx = await getCurrentBusiness();
  if (!ctx) throw new Error("Not authenticated");

  const supabase = await createClient();
  const { error } = await supabase
    .from("products")
    .delete()
    .eq("id", productId)
    .eq("business_id", ctx.business.id);

  if (error) throw new Error(error.message);
  revalidatePath("/products");
}

export async function addBatch(productId: string, values: BatchFormValues) {
  const ctx = await getCurrentBusiness();
  if (!ctx) throw new Error("Not authenticated");

  const parsed = batchSchema.parse(values);
  const supabase = await createClient();

  const { error } = await supabase.from("product_batches").insert({
    product_id: productId,
    business_id: ctx.business.id,
    batch_number: parsed.batch_number,
    mfg_date: parsed.mfg_date || null,
    expiry_date: parsed.expiry_date,
    mrp: parsed.mrp,
    selling_price: parsed.selling_price,
    stock_qty: parsed.stock_qty,
  });

  if (error) throw new Error(error.message);

  revalidatePath(`/products/${productId}`);
  revalidatePath("/inventory");
}

export async function deleteBatch(batchId: string, productId: string) {
  const ctx = await getCurrentBusiness();
  if (!ctx) throw new Error("Not authenticated");

  const supabase = await createClient();
  const { error } = await supabase
    .from("product_batches")
    .delete()
    .eq("id", batchId)
    .eq("business_id", ctx.business.id);

  if (error) throw new Error(error.message);

  revalidatePath(`/products/${productId}`);
  revalidatePath("/inventory");
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
  stock_qty?: string;
}

export async function bulkImportProducts(rows: BulkProductRow[]) {
  const ctx = await getCurrentBusiness();
  if (!ctx) throw new Error("Not authenticated");

  const supabase = await createClient();
  let created = 0;
  const errors: string[] = [];

  const { data: categories } = await supabase.from("categories").select("id, name");
  const categoryMap = new Map((categories ?? []).map((c) => [c.name.toLowerCase(), c.id]));

  for (const [index, row] of rows.entries()) {
    if (!row.name?.trim()) {
      errors.push(`Row ${index + 2}: missing product name`);
      continue;
    }

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
        gst_rate: row.gst_rate ? Number(row.gst_rate) : 0,
        status: "active",
      })
      .select("id")
      .single();

    if (productError) {
      errors.push(`Row ${index + 2}: ${productError.message}`);
      continue;
    }

    created++;

    if (row.batch_number && row.expiry_date && row.mrp && row.selling_price) {
      const { error: batchError } = await supabase.from("product_batches").insert({
        product_id: product.id,
        business_id: ctx.business.id,
        batch_number: row.batch_number,
        expiry_date: row.expiry_date,
        mrp: Number(row.mrp),
        selling_price: Number(row.selling_price),
        stock_qty: row.stock_qty ? Number(row.stock_qty) : 0,
      });
      if (batchError) errors.push(`Row ${index + 2} (batch): ${batchError.message}`);
    }
  }

  revalidatePath("/products");
  revalidatePath("/inventory");

  return { created, errors };
}
