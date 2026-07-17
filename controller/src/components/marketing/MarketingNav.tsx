"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

const TABS = [
  { href: "/marketing/coupons", label: "Coupons" },
  { href: "/marketing/banners", label: "Banners" },
];

export function MarketingNav() {
  const pathname = usePathname();

  return (
    <div className="mb-5 flex gap-1 border-b border-slate-100">
      {TABS.map((tab) => {
        const active = pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "relative px-4 py-2.5 text-sm font-medium transition-colors",
              active ? "text-primary-600" : "text-slate-500 hover:text-slate-700",
            )}
          >
            {tab.label}
            {active && <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-primary-600" />}
          </Link>
        );
      })}
    </div>
  );
}
