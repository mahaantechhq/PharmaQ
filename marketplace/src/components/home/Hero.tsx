"use client";

import { useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, ShieldCheck, FileCheck2, MapPinned, Building2, Package, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/Button";

const TRUST_POINTS = [
  { icon: ShieldCheck, label: "Verified businesses only" },
  { icon: FileCheck2, label: "GST-ready invoicing" },
  { icon: MapPinned, label: "Pan-India sourcing" },
];

export function Hero() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = inputRef.current?.value.trim();
    router.push(q ? `/search?q=${encodeURIComponent(q)}` : "/search");
  };

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary-900 via-primary-700 to-primary-500">
      <div className="pointer-events-none absolute inset-0 bg-dot-grid opacity-40" />
      <div className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-accent-500/20 blur-3xl animate-float" />
      <div className="pointer-events-none absolute -right-16 bottom-0 h-96 w-96 rounded-full bg-primary-300/20 blur-3xl animate-float-delay" />

      <div className="relative mx-auto grid max-w-7xl grid-cols-1 gap-12 px-4 py-20 sm:px-6 sm:py-28 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div className="max-w-2xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-primary-100">
            <span className="h-1.5 w-1.5 rounded-full bg-accent-400" />
            Tamil Nadu&apos;s B2B Pharma Marketplace
          </span>
          <h1 className="mt-5 font-display text-4xl font-semibold leading-[1.08] tracking-tight text-white sm:text-6xl">
            Source pharma products
            <span className="block text-primary-200">directly from verified businesses</span>
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-primary-100/90 sm:text-lg">
            Compare prices across suppliers, order from multiple businesses in one cart, and manage everything in one place.
          </p>

          <form onSubmit={handleSearch} className="mt-9 flex max-w-xl gap-2 rounded-2xl bg-white p-2 shadow-[var(--shadow-glow)]">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                ref={inputRef}
                type="search"
                placeholder="Search for Paracetamol, Insulin, Vitamin C..."
                className="h-12 w-full rounded-xl pl-9 pr-3 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none"
              />
            </div>
            <Button type="submit" size="lg" className="rounded-xl">Search</Button>
          </form>

          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
            {TRUST_POINTS.map((t) => (
              <span key={t.label} className="flex items-center gap-2 text-sm text-primary-100/90">
                <t.icon className="h-4 w-4 text-accent-400" />
                {t.label}
              </span>
            ))}
          </div>
        </div>

        <div className="relative hidden lg:block">
          <div className="absolute -top-4 right-8 flex items-center gap-3 rounded-2xl border border-white/15 bg-white/10 px-5 py-4 shadow-[var(--shadow-glow)] backdrop-blur-md animate-float">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-400/20 text-accent-400">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <p className="font-display text-lg font-semibold text-white">Verified suppliers</p>
              <p className="text-xs text-primary-100/80">Onboarded &amp; approved</p>
            </div>
          </div>

          <div className="absolute left-2 top-40 flex items-center gap-3 rounded-2xl border border-white/15 bg-white/10 px-5 py-4 shadow-[var(--shadow-glow)] backdrop-blur-md animate-float-delay">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-200/20 text-primary-100">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <p className="font-display text-lg font-semibold text-white">Wide catalog</p>
              <p className="text-xs text-primary-100/80">Across every category</p>
            </div>
          </div>

          <div className="absolute bottom-4 right-0 flex items-center gap-3 rounded-2xl border border-white/15 bg-white/10 px-5 py-4 shadow-[var(--shadow-glow)] backdrop-blur-md animate-float">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success-500/20 text-success-500">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <p className="font-display text-lg font-semibold text-white">Best-price discovery</p>
              <p className="text-xs text-primary-100/80">Compare before you order</p>
            </div>
          </div>

          <div className="mx-auto h-[420px] w-[420px] rounded-full border border-white/10" />
        </div>
      </div>
    </section>
  );
}
