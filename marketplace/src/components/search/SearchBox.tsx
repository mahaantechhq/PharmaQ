"use client";

import { useRef } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function SearchBox({ isLoggedIn = true }: { isLoggedIn?: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoggedIn) return;
    const q = inputRef.current?.value.trim();
    const params = new URLSearchParams(searchParams.toString());
    if (q) params.set("q", q);
    else params.delete("q");
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <form onSubmit={handleSearch} className="flex gap-2 rounded-xl border border-slate-200 bg-white p-1.5 shadow-[var(--shadow-card)]">
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          ref={inputRef}
          type="search"
          disabled={!isLoggedIn}
          defaultValue={searchParams.get("q") ?? ""}
          placeholder="Search for medicines, brands, suppliers..."
          className="h-10 w-full rounded-lg pl-9 pr-3 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none disabled:cursor-not-allowed"
        />
      </div>
      <Button type="submit" disabled={!isLoggedIn}>Search</Button>
    </form>
  );
}
