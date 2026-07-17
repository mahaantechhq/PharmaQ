import { ShieldCheck, TrendingDown, Truck, Users, Search, ShoppingCart, PackageCheck } from "lucide-react";

const BENEFITS = [
  { icon: ShieldCheck, title: "Verified businesses only", description: "Every seller is onboarded and approved by the Pharma Q team." },
  { icon: TrendingDown, title: "Compare prices instantly", description: "See every supplier's price for the same product side by side." },
  { icon: Truck, title: "One cart, many suppliers", description: "Order from multiple businesses in a single checkout — we split it for you." },
  { icon: Users, title: "Built for pharma businesses", description: "GST-ready invoices, batch tracking, and credit terms designed for the trade." },
];

const STEPS = [
  { icon: Search, title: "Search & compare", description: "Find the product you need and compare prices across suppliers." },
  { icon: ShoppingCart, title: "Add to cart & checkout", description: "Add from multiple suppliers, apply a coupon, and check out once." },
  { icon: PackageCheck, title: "Track & receive", description: "Each supplier fulfills their part independently — track every order." },
];

export function BenefitsAndHowItWorks() {
  return (
    <>
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <h2 className="mb-8 text-center text-xl font-semibold text-slate-900">Why businesses choose Pharma Q</h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {BENEFITS.map((b) => (
            <div key={b.title} className="rounded-xl border border-slate-100 bg-white p-5 text-center shadow-[var(--shadow-card)]">
              <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
                <b.icon className="h-5 w-5" />
              </div>
              <p className="text-sm font-semibold text-slate-800">{b.title}</p>
              <p className="mt-1 text-xs text-slate-500">{b.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="how-it-works" className="bg-slate-50 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <h2 className="mb-8 text-center text-xl font-semibold text-slate-900">How Pharma Q works</h2>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
            {STEPS.map((s, i) => (
              <div key={s.title} className="text-center">
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-600 text-white">
                  <s.icon className="h-6 w-6" />
                </div>
                <p className="text-sm font-semibold text-slate-800">{i + 1}. {s.title}</p>
                <p className="mt-1 text-sm text-slate-500">{s.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
