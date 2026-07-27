"use client";

import { useState, type ReactNode } from "react";
import { Modal } from "@/components/ui/Modal";
import { cn } from "@/lib/cn";

export interface StatBreakdownItem {
  name: string;
  count: number;
}

const toneClasses = {
  primary: "bg-primary-50 text-primary-600",
  success: "bg-success-50 text-success-600",
  warning: "bg-warning-50 text-warning-600",
};

export function SupplierStatCard({
  label,
  icon,
  tone = "primary",
  value,
  items,
}: {
  label: string;
  icon: ReactNode;
  tone?: keyof typeof toneClasses;
  value: number;
  items: StatBreakdownItem[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button onClick={() => setOpen(true)} className="w-full text-left">
        <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white p-4 shadow-[var(--shadow-card)] transition-shadow hover:shadow-[var(--shadow-card-hover)]">
          <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", toneClasses[tone])}>{icon}</div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p>
            <p className="mt-0.5 text-xl font-semibold text-slate-900">{value}</p>
          </div>
        </div>
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title={label} description={`${value} ${label.toLowerCase()}`} size="sm">
        {items.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-400">No {label.toLowerCase()} yet.</p>
        ) : (
          <div className="flex max-h-80 flex-col divide-y divide-slate-50 overflow-y-auto">
            {items.map((item) => (
              <div key={item.name} className="flex items-center justify-between py-2.5 text-sm">
                <span className="text-slate-700">{item.name}</span>
                <span className="text-slate-400">{item.count} product{item.count !== 1 ? "s" : ""}</span>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </>
  );
}
