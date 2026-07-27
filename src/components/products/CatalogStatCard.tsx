"use client";

import { useState, type ReactNode } from "react";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { cn } from "@/lib/cn";

export interface CatalogBreakdownItem {
  name: string;
  count: number;
}

const toneClasses = {
  primary: "bg-primary-50 text-primary-600",
  success: "bg-success-50 text-success-600",
  warning: "bg-warning-50 text-warning-600",
  danger: "bg-danger-50 text-danger-600",
};

export function CatalogStatCard({
  label,
  icon,
  tone = "primary",
  items,
}: {
  label: string;
  icon: ReactNode;
  tone?: keyof typeof toneClasses;
  items: CatalogBreakdownItem[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button onClick={() => setOpen(true)} className="w-full text-left">
        <Card className="cursor-pointer p-5 transition-shadow hover:shadow-[var(--shadow-card-hover)]">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">{items.length}</p>
            </div>
            <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", toneClasses[tone])}>
              {icon}
            </div>
          </div>
        </Card>
      </button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={label}
        description={`${items.length} ${label.toLowerCase()} across your products`}
        size="sm"
      >
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
