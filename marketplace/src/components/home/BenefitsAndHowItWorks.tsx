import { ShieldCheck, TrendingDown, Truck, Users, Gift, Search, ShoppingCart, PackageCheck } from "lucide-react";

const BENEFITS = [
  {
    icon: ShieldCheck,
    title: "Verified businesses only",
    description: "Every seller is onboarded and approved by the Pharma Q team before they can list a single product.",
    featured: true,
  },
  { icon: TrendingDown, title: "Compare prices instantly", description: "See every supplier's price for the same product side by side." },
  { icon: Truck, title: "One cart, many suppliers", description: "Order from multiple businesses in a single checkout — we split it for you." },
  { icon: Users, title: "Built for pharma businesses", description: "GST-ready invoices, batch tracking, and credit terms designed for the trade." },
  { icon: Gift, title: "Offers & rewards", description: "Apply coupons at checkout and unlock savings as your order volume grows." },
];

const STEPS = [
  { icon: Search, title: "Search & compare", description: "Find the product you need and compare prices across suppliers." },
  { icon: ShoppingCart, title: "Add to cart & checkout", description: "Add from multiple suppliers, apply a coupon, and check out once." },
  { icon: PackageCheck, title: "Track & receive", description: "Each supplier fulfills their part independently — track every order." },
];

export function BenefitsAndHowItWorks() {
  return (
    <>
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="mb-10 text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-primary-600">Why Pharma Q</p>
          <h2 className="mt-2 font-display text-2xl font-semibold text-slate-900 sm:text-3xl">Built for how pharma trade actually works</h2>
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {BENEFITS.map((b) =>
            b.featured ? (
              <div
                key={b.title}
                className="relative flex flex-col justify-between overflow-hidden rounded-2xl bg-gradient-to-br from-primary-700 to-primary-900 p-7 shadow-[var(--shadow-elevated)] sm:col-span-2 sm:row-span-2"
              >
                <div className="pointer-events-none absolute inset-0 bg-dot-grid opacity-25" />
                <div className="pointer-events-none absolute -bottom-10 -right-10 h-56 w-56 rounded-full bg-accent-500/10 blur-2xl" />
                <b.icon className="pointer-events-none absolute -bottom-8 -right-8 h-44 w-44 text-white/5" strokeWidth={1} />

                <div className="relative flex items-center justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-accent-400">
                    <b.icon className="h-6 w-6" />
                  </div>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold text-primary-100">
                    <span className="h-1.5 w-1.5 rounded-full bg-success-500" /> 100% reviewed
                  </span>
                </div>
                <div className="relative mt-8">
                  <p className="font-display text-xl font-semibold text-white">{b.title}</p>
                  <p className="mt-2 max-w-xs text-sm leading-relaxed text-primary-100/90">{b.description}</p>
                </div>
              </div>
            ) : (
              <div
                key={b.title}
                className="rounded-2xl border border-slate-100 bg-white p-6 shadow-[var(--shadow-card)] transition-all duration-200 hover:-translate-y-1 hover:shadow-[var(--shadow-elevated)]"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
                  <b.icon className="h-5 w-5" />
                </div>
                <p className="mt-4 text-sm font-semibold text-slate-800">{b.title}</p>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-500">{b.description}</p>
              </div>
            ),
          )}
        </div>
      </section>

      <section id="how-it-works" className="bg-slate-50 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mb-14 text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-primary-600">Process</p>
            <h2 className="mt-2 font-display text-2xl font-semibold text-slate-900 sm:text-3xl">How Pharma Q works</h2>
          </div>
          <div className="relative grid grid-cols-1 gap-10 sm:grid-cols-3">
            <div className="absolute left-0 right-0 top-7 hidden h-px bg-gradient-to-r from-transparent via-primary-200 to-transparent sm:block" />
            {STEPS.map((s, i) => (
              <div key={s.title} className="relative flex flex-col items-center text-center">
                <div className="relative z-10 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-600 text-white shadow-[var(--shadow-elevated)]">
                  <s.icon className="h-6 w-6" />
                  <span className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-accent-500 font-display text-xs font-bold text-white ring-4 ring-slate-50">
                    {i + 1}
                  </span>
                </div>
                <p className="mt-5 text-sm font-semibold text-slate-800">{s.title}</p>
                <p className="mt-1.5 max-w-[220px] text-sm leading-relaxed text-slate-500">{s.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
