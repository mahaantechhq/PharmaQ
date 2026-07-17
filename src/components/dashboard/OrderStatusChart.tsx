"use client";

import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

const COLORS: Record<string, string> = {
  Placed: "#2e90fa",
  Accepted: "#014baa",
  Packed: "#f79009",
  Shipped: "#f79009",
  Delivered: "#12b76a",
  Completed: "#039855",
  Rejected: "#f04438",
  Cancelled: "#94a3b8",
  Returned: "#d92d20",
};

export function OrderStatusChart({ data }: { data: { name: string; value: number }[] }) {
  const filtered = data.filter((d) => d.value > 0);

  if (filtered.length === 0) {
    return (
      <div className="flex h-[220px] items-center justify-center text-sm text-slate-400">
        No orders yet
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={filtered}
          dataKey="value"
          nameKey="name"
          innerRadius={55}
          outerRadius={80}
          paddingAngle={2}
        >
          {filtered.map((entry) => (
            <Cell key={entry.name} fill={COLORS[entry.name] ?? "#94a3b8"} />
          ))}
        </Pie>
        <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #eef1f5", fontSize: 12 }} />
        <Legend
          layout="vertical"
          align="right"
          verticalAlign="middle"
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize: 12, color: "#475569" }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
