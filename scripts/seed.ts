/**
 * Seeds one demo supplier business (with owner login), a second buyer
 * business, shared catalog, sample products/batches, sample supplier
 * orders across the full status range, a wallet, and notifications.
 *
 * This stands in for the future Super Admin "create business" flow.
 * Run with: npm run seed
 */
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config({ path: ".env.local" });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const SUPPLIER_OWNER_EMAIL = "owner@abcmedicals.pharmaq.in";
const SUPPLIER_OWNER_PASSWORD = "PharmaQ@Demo123";
const BUYER_OWNER_EMAIL = "owner@xyzpharma.pharmaq.in";
const BUYER_OWNER_PASSWORD = "PharmaQ@Demo123";

function daysFromNow(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

async function createBusinessWithOwner(opts: {
  name: string;
  slug: string;
  email: string;
  password: string;
  ownerName: string;
}) {
  const { data: existingUsers } = await supabase.auth.admin.listUsers();
  let userId = existingUsers.users.find((u) => u.email === opts.email)?.id;

  if (!userId) {
    const { data, error } = await supabase.auth.admin.createUser({
      email: opts.email,
      password: opts.password,
      email_confirm: true,
    });
    if (error) throw error;
    userId = data.user!.id;
  }

  const { data: business, error: bizError } = await supabase
    .from("businesses")
    .upsert(
      {
        name: opts.name,
        slug: opts.slug,
        status: "approved",
        approved_at: new Date().toISOString(),
        gstin: "27AAAPL1234C1ZV",
        drug_license_no: "MH-DL-" + Math.floor(Math.random() * 100000),
        phone: "+91 98765 43210",
        email: opts.email,
        address_line1: "Plot 12, Industrial Estate",
        city: "Mumbai",
        state: "Maharashtra",
        pincode: "400001",
      },
      { onConflict: "slug" },
    )
    .select()
    .single();
  if (bizError) throw bizError;

  const { error: ownerError } = await supabase.from("business_owners").upsert({
    id: userId,
    business_id: business.id,
    full_name: opts.ownerName,
    phone: "+91 98765 43210",
  });
  if (ownerError) throw ownerError;

  await supabase.from("wallets").upsert(
    { business_id: business.id, balance: 25000, credit_limit: 100000 },
    { onConflict: "business_id" },
  );

  return { userId, business };
}

async function upsertMasters(
  table: "categories" | "brands" | "manufacturers",
  names: string[],
) {
  const rows = names.map((name) => ({
    name,
    slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    is_global: true,
  }));
  const { data, error } = await supabase
    .from(table)
    .upsert(rows, { onConflict: "slug" })
    .select();
  if (error) throw error;
  return data as { id: string; name: string }[];
}

async function main() {
  console.log("Seeding Pharma Q demo data...\n");

  const supplier = await createBusinessWithOwner({
    name: "ABC Medicals",
    slug: "abc-medicals",
    email: SUPPLIER_OWNER_EMAIL,
    password: SUPPLIER_OWNER_PASSWORD,
    ownerName: "Anil Bhatia",
  });
  console.log("Created supplier business:", supplier.business.name);

  const buyer = await createBusinessWithOwner({
    name: "XYZ Pharma Distributors",
    slug: "xyz-pharma-distributors",
    email: BUYER_OWNER_EMAIL,
    password: BUYER_OWNER_PASSWORD,
    ownerName: "Kavita Rao",
  });
  console.log("Created buyer business:", buyer.business.name);

  const categories = await upsertMasters("categories", [
    "Analgesics",
    "Antibiotics",
    "Vitamins & Supplements",
    "Diabetes Care",
    "Cardiac Care",
  ]);
  const brands = await upsertMasters("brands", ["Cipla", "Sun Pharma", "Dr. Reddy's", "Abbott"]);
  const manufacturers = await upsertMasters("manufacturers", [
    "Cipla Ltd",
    "Sun Pharmaceutical Industries",
    "Dr. Reddy's Laboratories",
    "Abbott Healthcare",
  ]);

  const byName = <T extends { name: string }>(list: T[], name: string) =>
    list.find((x) => x.name === name)!;

  const productDefs = [
    { name: "Paracetamol 650mg", composition: "Paracetamol 650mg", pack: "Strip of 15", category: "Analgesics", gst: 12 },
    { name: "Dolo 650", composition: "Paracetamol 650mg", pack: "Strip of 15", category: "Analgesics", gst: 12 },
    { name: "Amoxicillin 500mg", composition: "Amoxicillin 500mg", pack: "Strip of 10", category: "Antibiotics", gst: 12 },
    { name: "Azithromycin 500mg", composition: "Azithromycin 500mg", pack: "Strip of 5", category: "Antibiotics", gst: 12 },
    { name: "Vitamin C 500mg", composition: "Ascorbic Acid 500mg", pack: "Bottle of 30", category: "Vitamins & Supplements", gst: 5 },
    { name: "Insulin Glargine", composition: "Insulin Glargine 100IU/ml", pack: "Vial 3ml", category: "Diabetes Care", gst: 5 },
    { name: "Metformin 500mg", composition: "Metformin HCl 500mg", pack: "Strip of 20", category: "Diabetes Care", gst: 12 },
    { name: "Atorvastatin 10mg", composition: "Atorvastatin Calcium 10mg", pack: "Strip of 10", category: "Cardiac Care", gst: 12 },
  ];

  const products: { id: string; name: string }[] = [];

  for (const def of productDefs) {
    const { data: product, error } = await supabase
      .from("products")
      .upsert(
        {
          business_id: supplier.business.id,
          category_id: byName(categories, def.category).id,
          brand_id: brands[Math.floor(Math.random() * brands.length)].id,
          manufacturer_id: manufacturers[Math.floor(Math.random() * manufacturers.length)].id,
          name: def.name,
          slug: def.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
          composition: def.composition,
          pack_size: def.pack,
          hsn_code: "3004",
          gst_rate: def.gst,
          description: `${def.name} — sourced directly from ${supplier.business.name}.`,
          status: "active",
        },
        { onConflict: "business_id,slug" },
      )
      .select()
      .single();
    if (error) throw error;
    products.push(product);

    const batches = [
      { batch_number: `B-${product.id.slice(0, 6)}-1`, expiry: daysFromNow(20), mrp: 45, price: 38, qty: 120 },
      { batch_number: `B-${product.id.slice(0, 6)}-2`, expiry: daysFromNow(240), mrp: 45, price: 40, qty: 300 },
      { batch_number: `B-${product.id.slice(0, 6)}-3`, expiry: daysFromNow(540), mrp: 45, price: 42, qty: 500 },
    ];
    for (const b of batches) {
      const { error: batchError } = await supabase.from("product_batches").upsert(
        {
          product_id: product.id,
          business_id: supplier.business.id,
          batch_number: b.batch_number,
          expiry_date: b.expiry,
          mfg_date: daysFromNow(-180),
          mrp: b.mrp,
          selling_price: b.price,
          stock_qty: b.qty,
        },
        { onConflict: "product_id,batch_number" },
      );
      if (batchError) throw batchError;
    }
  }
  console.log(`Created ${products.length} products with batches`);

  const orderStatuses: { status: string; count: number }[] = [
    { status: "placed", count: 1 },
    { status: "accepted", count: 1 },
    { status: "shipped", count: 1 },
    { status: "delivered", count: 1 },
    { status: "completed", count: 1 },
  ];

  let orderIndex = 1;
  for (const { status } of orderStatuses) {
    const orderNumber = `PQ-${new Date().getFullYear()}-${String(orderIndex).padStart(4, "0")}`;

    const { data: existingSupplierOrder } = await supabase
      .from("supplier_orders")
      .select("id")
      .eq("order_number", orderNumber)
      .eq("supplier_business_id", supplier.business.id)
      .maybeSingle();

    if (existingSupplierOrder) {
      console.log(`Skipping ${orderNumber} — already seeded`);
      orderIndex++;
      continue;
    }

    const chosenProducts = products.slice(0, 3);

    let subtotal = 0;
    const items = chosenProducts.map((p, i) => {
      const qty = 10 + i * 5;
      const unitPrice = 40;
      const lineTotal = qty * unitPrice;
      subtotal += lineTotal;
      return { product: p, qty, unitPrice, lineTotal };
    });
    const taxTotal = Math.round(subtotal * 0.12 * 100) / 100;
    const grandTotal = subtotal + taxTotal;

    const { data: masterOrder, error: orderError } = await supabase
      .from("orders")
      .upsert(
        {
          order_number: orderNumber,
          buyer_business_id: buyer.business.id,
          subtotal,
          tax_total: taxTotal,
          grand_total: grandTotal,
        },
        { onConflict: "order_number" },
      )
      .select()
      .single();
    if (orderError) throw orderError;

    const { data: supplierOrder, error: soError } = await supabase
      .from("supplier_orders")
      .insert({
        order_id: masterOrder.id,
        order_number: orderNumber,
        supplier_business_id: supplier.business.id,
        buyer_business_id: buyer.business.id,
        status,
        subtotal,
        tax_total: taxTotal,
        grand_total: grandTotal,
      })
      .select()
      .single();
    if (soError) throw soError;

    for (const item of items) {
      await supabase.from("supplier_order_items").insert({
        supplier_order_id: supplierOrder.id,
        product_id: item.product.id,
        product_name: item.product.name,
        quantity: item.qty,
        unit_price: item.unitPrice,
        gst_rate: 12,
        line_total: item.lineTotal,
      });
    }

    const historyStatuses = ["placed", "accepted", "invoiced", "packed", "shipped", "delivered", "completed"];
    const uptoIndex = historyStatuses.indexOf(status);
    for (let i = 0; i <= uptoIndex; i++) {
      await supabase.from("order_status_history").insert({
        supplier_order_id: supplierOrder.id,
        status: historyStatuses[i],
        changed_at: new Date(Date.now() - (uptoIndex - i) * 86400000).toISOString(),
      });
    }

    if (status === "completed" || status === "delivered") {
      await supabase.from("invoices").upsert(
        {
          supplier_order_id: supplierOrder.id,
          invoice_number: `INV-${orderNumber}`,
          subtotal,
          tax_total: taxTotal,
          grand_total: grandTotal,
        },
        { onConflict: "supplier_order_id" },
      );
    }

    orderIndex++;
  }
  console.log(`Created ${orderStatuses.length} supplier orders across statuses`);

  const { data: wallet } = await supabase
    .from("wallets")
    .select("id")
    .eq("business_id", supplier.business.id)
    .single();

  if (wallet) {
    await supabase.from("wallet_transactions").insert([
      { wallet_id: wallet.id, type: "credit", amount: 15000, description: "Order settlement — PQ-2026-0004" },
      { wallet_id: wallet.id, type: "debit", amount: 2000, description: "Platform commission" },
      { wallet_id: wallet.id, type: "credit", amount: 12000, description: "Order settlement — PQ-2026-0005" },
    ]);
  }

  await supabase.from("notifications").insert([
    { business_id: supplier.business.id, title: "New order received", message: "XYZ Pharma Distributors placed a new order.", type: "order" },
    { business_id: supplier.business.id, title: "Batch expiring soon", message: "Paracetamol 650mg batch expires in 20 days.", type: "inventory" },
    { business_id: supplier.business.id, title: "Wallet credited", message: "₹15,000 credited for order PQ-2026-0004.", type: "wallet" },
  ]);

  console.log("\nSeed complete.\n");
  console.log("Login to the Business Dashboard with:");
  console.log(`  Email:    ${SUPPLIER_OWNER_EMAIL}`);
  console.log(`  Password: ${SUPPLIER_OWNER_PASSWORD}`);
  console.log("\n(Second business for RLS testing:)");
  console.log(`  Email:    ${BUYER_OWNER_EMAIL}`);
  console.log(`  Password: ${BUYER_OWNER_PASSWORD}`);
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
