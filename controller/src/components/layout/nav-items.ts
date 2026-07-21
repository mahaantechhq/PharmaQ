import {
  LayoutDashboard,
  Building2,
  Tags,
  Megaphone,
  Wallet,
  BarChart3,
  Bell,
  ScrollText,
  Settings,
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
    label: "Platform",
    items: [
      { label: "Businesses", href: "/businesses", icon: Building2 },
      { label: "Catalog", href: "/catalog/categories", icon: Tags },
      { label: "Marketing", href: "/marketing/banners", icon: Megaphone },
    ],
  },
  {
    label: "Finance",
    items: [
      { label: "Wallet & Credit", href: "/wallet", icon: Wallet },
      { label: "Reports", href: "/reports", icon: BarChart3 },
    ],
  },
  {
    label: "Operations",
    items: [
      { label: "Notifications", href: "/notifications", icon: Bell },
      { label: "Audit Logs", href: "/audit-logs", icon: ScrollText },
      { label: "Settings", href: "/settings", icon: Settings },
    ],
  },
];
