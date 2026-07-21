export type BusinessStatus = "pending" | "approved" | "suspended";
export type ProductStatus = "draft" | "active" | "inactive";
export type SupplierOrderStatus =
  | "placed"
  | "accepted"
  | "rejected"
  | "invoiced"
  | "packed"
  | "shipped"
  | "delivered"
  | "completed"
  | "cancelled"
  | "returned";
export type WalletTransactionType = "credit" | "debit";
export type NotificationType = "order" | "system" | "wallet" | "inventory";

export interface Business {
  id: string;
  name: string;
  slug: string;
  gstin: string | null;
  drug_license_no: string | null;
  status: BusinessStatus;
  phone: string | null;
  email: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  logo_url: string | null;
  created_at: string;
  approved_at: string | null;
}

export interface BusinessOwner {
  id: string;
  business_id: string;
  full_name: string;
  phone: string | null;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  is_global: boolean;
  created_by_business_id: string | null;
  created_at: string;
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
  is_global: boolean;
  created_by_business_id: string | null;
  created_at: string;
}

export interface Manufacturer {
  id: string;
  name: string;
  slug: string;
  is_global: boolean;
  created_by_business_id: string | null;
  created_at: string;
}

export interface Product {
  id: string;
  business_id: string;
  category_id: string | null;
  brand_id: string | null;
  manufacturer_id: string | null;
  name: string;
  slug: string;
  composition: string | null;
  pack_size: string | null;
  hsn_code: string | null;
  gst_rate: number;
  description: string | null;
  images: string[];
  status: ProductStatus;
  created_at: string;
  updated_at: string;
}

export interface ProductBatch {
  id: string;
  product_id: string;
  business_id: string;
  batch_number: string;
  mfg_date: string | null;
  expiry_date: string;
  mrp: number;
  selling_price: number;
  stock_qty: number;
  created_at: string;
}

export interface Order {
  id: string;
  order_number: string;
  buyer_business_id: string;
  subtotal: number;
  tax_total: number;
  grand_total: number;
  created_at: string;
}

export interface SupplierOrder {
  id: string;
  order_id: string;
  order_number: string;
  supplier_business_id: string;
  buyer_business_id: string;
  status: SupplierOrderStatus;
  subtotal: number;
  tax_total: number;
  grand_total: number;
  created_at: string;
  updated_at: string;
}

export interface SupplierOrderItem {
  id: string;
  supplier_order_id: string;
  product_id: string;
  batch_id: string | null;
  product_name: string;
  batch_number: string | null;
  quantity: number;
  unit_price: number;
  gst_rate: number;
  line_total: number;
}

export interface OrderStatusHistory {
  id: string;
  supplier_order_id: string;
  status: SupplierOrderStatus;
  note: string | null;
  changed_by: string | null;
  changed_at: string;
}

export interface Invoice {
  id: string;
  supplier_order_id: string;
  invoice_number: string;
  invoice_date: string;
  subtotal: number;
  tax_total: number;
  grand_total: number;
  created_at: string;
}

export interface Wallet {
  id: string;
  business_id: string;
  balance: number;
  credit_limit: number;
  updated_at: string;
}

export interface WalletTransaction {
  id: string;
  wallet_id: string;
  type: WalletTransactionType;
  amount: number;
  reference_type: string | null;
  reference_id: string | null;
  description: string | null;
  created_at: string;
}

export interface Notification {
  id: string;
  business_id: string;
  title: string;
  message: string;
  type: NotificationType;
  is_read: boolean;
  created_at: string;
}

export interface BusinessCustomer {
  buyer_business_id: string;
  buyer_name: string;
  total_orders: number;
  total_spent: number;
  last_order_at: string;
}

export type CatalogItemStatus = "active" | "inactive";
export type BannerPosition = "hero" | "category" | "sidebar";

export interface Banner {
  id: string;
  title: string;
  image_url: string;
  link_url: string | null;
  position: BannerPosition;
  sort_order: number;
  status: CatalogItemStatus;
  starts_at: string | null;
  ends_at: string | null;
  created_at: string;
}

export interface PlatformSetting {
  key: string;
  value: unknown;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  actor_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}
