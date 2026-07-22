"use client";

import { useRef } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function LoggedInHero({ ownerName }: { ownerName: string }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const firstName = ownerName.split(" ")[0];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = inputRef.current?.value.trim();
    router.push(q ? `/search?q=${encodeURIComponent(q)}` : "/search");
  };

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary-700 to-primary-500">
      <div className="pointer-events-none absolute inset-0 bg-dot-grid opacity-30" />
      <div className="relative mx-auto flex max-w-3xl flex-col items-center px-4 py-[68px] text-center sm:px-6">
        <h1 className="font-display text-2xl font-semibold text-white sm:text-3xl">Hi {firstName}, how can we help you today?</h1>
        <form onSubmit={handleSearch} className="mt-6 flex w-full max-w-xl gap-2 rounded-2xl bg-white p-2 shadow-[var(--shadow-glow)]">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              ref={inputRef}
              type="search"
              onFocus={() => router.push("/search")}
              placeholder="Search for medicines, brands, suppliers..."
              className="h-11 w-full rounded-xl pl-9 pr-3 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none"
            />
          </div>
          <Button type="submit" size="lg" className="rounded-xl">Search</Button>
        </form>
      </div>
    </section>
  );
}
