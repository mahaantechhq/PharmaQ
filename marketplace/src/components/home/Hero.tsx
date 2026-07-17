"use client";

import { useRef } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/Button";

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
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28">
        <div className="max-w-2xl">
          <span className="inline-block rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-primary-100">
            India&apos;s B2B Pharma Marketplace
          </span>
          <h1 className="mt-4 text-3xl font-semibold leading-tight text-white sm:text-5xl">
            Source pharma products directly from verified businesses
          </h1>
          <p className="mt-4 text-lg text-primary-100">
            Compare prices across suppliers, order from multiple businesses in one cart, and manage everything in one place.
          </p>

          <form onSubmit={handleSearch} className="mt-8 flex max-w-xl gap-2 rounded-xl bg-white p-2 shadow-2xl">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                ref={inputRef}
                type="search"
                placeholder="Search for Paracetamol, Insulin, Vitamin C..."
                className="h-11 w-full rounded-lg pl-9 pr-3 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none"
              />
            </div>
            <Button type="submit" size="lg">Search</Button>
          </form>
        </div>
      </div>
    </section>
  );
}
