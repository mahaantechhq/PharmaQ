import {
  LayoutDashboard,
  Package,
  Boxes,
  Tags,
  Percent,
  ShoppingCart,
  FileText,
  Users,
  BarChart3,
  Bell,
  Settings,
  CreditCard,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export interface NavGroup {
  label?: string;
  items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    items: [{ label: "Dashboard", href: "/dashboard", icon: LayoutDashboard }],
  },
  {
    label: "Catalog",
    items: [
      { label: "Products", href: "/products", icon: Package },
      { label: "Inventory", href: "/inventory", icon: Boxes },
      { label: "Categories & Brands", href: "/catalog/categories", icon: Tags },
    ],
  },
  {
    label: "Sales",
    items: [
      { label: "Orders Received", href: "/orders", icon: ShoppingCart },
      { label: "Invoices", href: "/invoices", icon: FileText },
      { label: "Customers", href: "/customers", icon: Users },
      { label: "Offers", href: "/offers", icon: Percent },
    ],
  },
  {
    label: "Finance",
    items: [
      { label: "Payments", href: "/payments", icon: CreditCard },
      { label: "Reports", href: "/reports", icon: BarChart3 },
    ],
  },
  {
    label: "Account",
    items: [
      { label: "Notifications", href: "/notifications", icon: Bell },
      { label: "Settings", href: "/settings", icon: Settings },
    ],
  },
];
