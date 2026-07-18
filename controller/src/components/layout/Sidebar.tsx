"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { cn } from "@/lib/cn";
import { NAV_GROUPS } from "@/components/layout/nav-items";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 flex h-screen w-64 flex-col border-r border-navy-800 bg-navy-900">
      <div className="flex h-16 items-center gap-2.5 border-b border-white/10 px-4">
        <Image src="/logo-icon.png" alt="Pharma Q" width={36} height={36} className="shrink-0 rounded-lg" priority />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-white">Pharma Q</p>
          <p className="flex items-center gap-1 truncate text-xs text-primary-200">
            <ShieldCheck className="h-3 w-3" /> Controller
          </p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {NAV_GROUPS.map((group, i) => (
          <div key={i} className="mb-5">
            {group.label && (
              <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-white/30">
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
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                      active ? "bg-white/10 text-white" : "text-white/60 hover:bg-white/5 hover:text-white",
                    )}
                  >
                    <Icon className="h-[18px] w-[18px] shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
}
