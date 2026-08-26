import { Search, Check, ShieldCheck, TrendingUp, Pill, Stethoscope, Syringe, Package2 } from "lucide-react";
import { Button } from "@/components/ui/Button";

const CHECKLIST = [
  "Digital Ordering — compare prices and order from multiple suppliers in one cart",
  "Verified Suppliers — GST-ready invoicing from approved businesses only",
];

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-white">
      <div className="pointer-events-none absolute -left-32 -top-32 h-[28rem] w-[28rem] rounded-full bg-primary-50" />
      <div className="pointer-events-none absolute -right-24 bottom-0 h-96 w-96 rounded-full bg-primary-50/70" />

      <div className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-16 px-4 py-20 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:py-28">
        <div className="max-w-xl">
          <h1 className="font-display text-4xl font-extrabold leading-[1.1] tracking-tight text-slate-900 sm:text-5xl">
            <span className="block">Grow Your</span>
            <span className="block"><span className="text-primary-600">Pharma</span> Sales with</span>
            <span className="block"><span className="text-primary-600">Pharma Q</span></span>
          </h1>
          <p className="mt-5 text-base leading-relaxed text-slate-500 sm:text-lg">
            Browse, Order and Grow with Tamil Nadu&apos;s biggest B2B pharma marketplace — place online orders to your distributors and get:
          </p>

          <ul className="mt-6 flex flex-col gap-3">
            {CHECKLIST.map((item) => (
              <li key={item} className="flex items-start gap-2.5 text-sm text-slate-600 sm:text-base">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-success-50 text-success-600">
                  <Check className="h-3.5 w-3.5" strokeWidth={3} />
                </span>
                {item}
              </li>
            ))}
          </ul>

          <div className="mt-8 flex max-w-md gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-2">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                disabled
                placeholder="Search for Paracetamol, Insulin, Vitamin C..."
                className="h-11 w-full cursor-not-allowed rounded-xl bg-transparent pl-9 pr-3 text-sm text-slate-500 placeholder:text-slate-400 focus:outline-none"
              />
            </div>
            <Button size="lg" className="rounded-xl disabled:opacity-100" disabled>Search</Button>
          </div>
        </div>

        <div className="relative hidden lg:block">
          <div className="mx-auto flex w-64 flex-col gap-3 rounded-[2.5rem] border-8 border-slate-900 bg-slate-900 p-3 shadow-2xl">
            <div className="flex items-center justify-between px-2 pt-1">
              <span className="font-display text-sm font-bold text-white">Pharma Q</span>
              <span className="h-2 w-2 rounded-full bg-success-500" />
            </div>
            <div className="grid grid-cols-2 gap-2 rounded-2xl bg-white p-3">
              {[Pill, Syringe, Stethoscope, Package2].map((Icon, i) => (
                <div key={i} className="flex aspect-square flex-col items-center justify-center gap-1.5 rounded-xl bg-primary-50">
                  <Icon className="h-6 w-6 text-primary-600" />
                </div>
              ))}
            </div>
            <button className="rounded-xl bg-primary-600 py-2.5 text-center text-sm font-semibold text-white" disabled>
              Order Now
            </button>
          </div>

          <div className="absolute -left-6 top-6 flex items-center gap-3 rounded-2xl border border-slate-100 bg-white px-4 py-3 shadow-[var(--shadow-card)] animate-float">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-success-50 text-success-600">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">Verified suppliers</p>
              <p className="text-xs text-slate-400">Onboarded &amp; approved</p>
            </div>
          </div>

          <div className="absolute -right-8 bottom-10 flex items-center gap-3 rounded-2xl border border-slate-100 bg-white px-4 py-3 shadow-[var(--shadow-card)] animate-float-delay">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-50 text-accent-600">
              <TrendingUp className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">Best-price discovery</p>
              <p className="text-xs text-slate-400">Compare before you order</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
