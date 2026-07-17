"use client";

import { useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";

interface Tab {
  key: string;
  label: string;
  content: ReactNode;
}

export function Tabs({ tabs, defaultKey }: { tabs: Tab[]; defaultKey?: string }) {
  const [active, setActive] = useState(defaultKey ?? tabs[0]?.key);
  const activeTab = tabs.find((t) => t.key === active);

  return (
    <div>
      <div className="flex gap-1 border-b border-slate-100">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActive(tab.key)}
            className={cn(
              "relative px-4 py-2.5 text-sm font-medium transition-colors",
              active === tab.key ? "text-primary-600" : "text-slate-500 hover:text-slate-700",
            )}
          >
            {tab.label}
            {active === tab.key && (
              <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-primary-600" />
            )}
          </button>
        ))}
      </div>
      <div className="pt-5">{activeTab?.content}</div>
    </div>
  );
}
