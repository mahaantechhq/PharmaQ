import { ShieldCheck, Lock, Wallet } from "lucide-react";

const BADGES = [
  { icon: ShieldCheck, label: "Reliable" },
  { icon: Lock, label: "Secured" },
  { icon: Wallet, label: "Affordable" },
];

export function TrustBadges() {
  return (
    <div className="bg-accent-50">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-4 px-4 py-6 sm:px-6 sm:gap-6">
        {BADGES.map((b, i) => (
          <div key={b.label} className="flex items-center gap-4 sm:gap-6">
            {i > 0 && <span className="hidden h-5 w-px bg-accent-500/30 sm:block" />}
            <span className="flex items-center gap-2 text-sm font-semibold text-slate-800">
              <b.icon className="h-4 w-4 text-accent-500" />
              {b.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
