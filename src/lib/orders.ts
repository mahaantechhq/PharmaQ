import type { SupplierOrderStatus } from "@/lib/types/database";

export const STATUS_FLOW: Record<SupplierOrderStatus, SupplierOrderStatus[]> = {
  // "completed"/"placed" here are the Complete/Incomplete toggle buttons on
  // Orders Received -- the rest of the chain (accepted/invoiced/packed/
  // shipped/delivered) has no buttons left to reach it, but is kept here
  // rather than deleted since existing orders may already sit in those
  // states.
  placed: ["accepted", "rejected", "completed"],
  accepted: ["invoiced", "delivered", "cancelled"],
  rejected: [],
  invoiced: ["packed"],
  packed: ["shipped"],
  shipped: ["delivered"],
  delivered: ["completed", "returned"],
  completed: ["returned", "placed"],
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
