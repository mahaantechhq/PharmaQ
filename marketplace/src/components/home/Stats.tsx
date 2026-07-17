import type { HomepageStats } from "@/lib/homepage";
import { formatNumber } from "@/lib/format";

export function Stats({ stats }: { stats: HomepageStats }) {
  const items = [
    { label: "Verified businesses", value: stats.businessCount },
    { label: "Products listed", value: stats.productCount },
    { label: "Orders completed", value: stats.completedOrderCount },
    { label: "Cities covered", value: stats.cityCount },
  ];

  return (
    <section className="bg-primary-600">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-4 py-12 sm:px-6 md:grid-cols-4">
        {items.map((item) => (
          <div key={item.label} className="text-center">
            <p className="text-3xl font-semibold text-white">{formatNumber(item.value)}+</p>
            <p className="mt-1 text-sm text-primary-100">{item.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
