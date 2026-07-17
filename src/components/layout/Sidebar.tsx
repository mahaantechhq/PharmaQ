"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { cn } from "@/lib/cn";
import { NAV_GROUPS } from "@/components/layout/nav-items";
import type { Business } from "@/lib/types/database";

export function Sidebar({ business }: { business: Business }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "flex h-screen flex-col border-r border-slate-100 bg-white transition-all duration-200 sticky top-0",
        collapsed ? "w-[76px]" : "w-64",
      )}
    >
      <div className="flex h-16 items-center gap-2.5 border-b border-slate-100 px-4">
        {collapsed ? (
          <Image src="/logo-icon.png" alt="Pharma Q" width={36} height={36} className="rounded-lg" />
        ) : (
          <Image src="/logo.png" alt="Pharma Q" width={140} height={38} priority />
        )}
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {NAV_GROUPS.map((group, i) => (
          <div key={i} className="mb-5">
            {group.label && !collapsed && (
              <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                {group.label}
              </p>
            )}
            <div className="flex flex-col gap-0.5">
              {group.items.map((item) => {
                const active = pathname.startsWith(item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={collapsed ? item.label : undefined}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                      active
                        ? "bg-primary-50 text-primary-700"
                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-800",
                    )}
                  >
                    <Icon className="h-[18px] w-[18px] shrink-0" />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-slate-100 p-3">
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-800"
        >
          {collapsed ? <PanelLeftOpen className="h-[18px] w-[18px]" /> : <PanelLeftClose className="h-[18px] w-[18px]" />}
          {!collapsed && "Collapse"}
        </button>
        {!collapsed && (
          <div className="mt-2 rounded-lg bg-slate-50 px-3 py-2.5">
            <p className="truncate text-xs font-medium text-slate-600">{business.name}</p>
            <p className="truncate text-[11px] text-slate-400">{business.status === "approved" ? "Verified business" : business.status}</p>
          </div>
        )}
      </div>
    </aside>
  );
}
