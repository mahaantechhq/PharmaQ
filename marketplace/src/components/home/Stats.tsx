import { Building2, PackageSearch, CheckCircle2, MapPin } from "lucide-react";

const STATS = [
  { icon: Building2, label: "Verified businesses", value: "10+" },
  { icon: PackageSearch, label: "Products listed", value: "10,000+" },
  { icon: CheckCircle2, label: "Orders completed", value: "1000+" },
  { icon: MapPin, label: "Cities covered", value: "2+" },
];

export function Stats() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary-900 to-primary-700">
      <div className="pointer-events-none absolute inset-0 bg-dot-grid opacity-30" />
      <div className="relative mx-auto grid max-w-7xl grid-cols-2 gap-x-6 gap-y-10 px-4 py-16 sm:px-6 md:grid-cols-4 md:divide-x md:divide-white/10">
        {STATS.map((item) => (
          <div key={item.label} className="flex flex-col items-center gap-2 text-center md:px-6">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-accent-400">
              <item.icon className="h-5 w-5" />
            </div>
            <p className="font-display text-3xl font-bold text-white sm:text-4xl">{item.value}</p>
            <p className="text-sm text-primary-100/90">{item.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
