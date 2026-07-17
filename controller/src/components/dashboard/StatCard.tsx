import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/cn";

export function StatCard({
  label,
  value,
  icon: Icon,
  trend,
  tone = "primary",
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  trend?: { value: string; direction: "up" | "down" };
  tone?: "primary" | "success" | "warning" | "danger";
}) {
  const toneClasses = {
    primary: "bg-primary-50 text-primary-600",
    success: "bg-success-50 text-success-600",
    warning: "bg-warning-50 text-warning-600",
    danger: "bg-danger-50 text-danger-600",
  }[tone];

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>
        </div>
        <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", toneClasses)}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      {trend && (
        <div className="mt-3 flex items-center gap-1 text-xs font-medium">
          {trend.direction === "up" ? (
            <ArrowUpRight className="h-3.5 w-3.5 text-success-600" />
          ) : (
            <ArrowDownRight className="h-3.5 w-3.5 text-danger-500" />
          )}
          <span className={trend.direction === "up" ? "text-success-600" : "text-danger-500"}>
            {trend.value}
          </span>
          <span className="text-slate-400">vs last period</span>
        </div>
      )}
    </Card>
  );
}
