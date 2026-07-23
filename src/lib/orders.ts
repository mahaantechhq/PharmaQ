import type { SupplierOrderStatus } from "@/lib/types/database";

export const STATUS_FLOW: Record<SupplierOrderStatus, SupplierOrderStatus[]> = {
  placed: ["accepted", "rejected"],
  accepted: ["invoiced", "delivered", "cancelled"],
  rejected: [],
  invoiced: ["packed"],
  packed: ["shipped"],
  shipped: ["delivered"],
  delivered: ["completed", "returned"],
  completed: ["returned"],
  cancelled: [],
  returned: [],
};

export const STATUS_LABELS: Record<SupplierOrderStatus, string> = {
  placed: "Placed",
  accepted: "Accept order",
  rejected: "Reject order",
  invoiced: "Generate invoice",
  packed: "Mark as packed",
  shipped: "Mark as shipped",
  delivered: "Mark as delivered",
  completed: "Mark as completed",
  cancelled: "Cancel order",
  returned: "Mark as returned",
};
