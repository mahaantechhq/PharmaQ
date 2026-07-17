"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useRef, useState } from "react";
import { Search, ShoppingCart, Heart, Bell, User, LogOut, Package, LayoutGrid } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Dropdown, DropdownItem } from "@/components/ui/Dropdown";
import { cn } from "@/lib/cn";

const CATEGORIES_LINK = "/search";

export function Navbar({
  businessName,
  cartCount = 0,
  unreadCount = 0,
}: {
  businessName: string | null;
  cartCount?: number;
  unreadCount?: number;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [scrolled, setScrolled] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = inputRef.current?.value.trim();
    router.push(q ? `/search?q=${encodeURIComponent(q)}` : "/search");
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  return (
    <header className={cn("sticky top-0 z-40 border-b border-slate-100 bg-white/90 backdrop-blur")}>
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-600 text-sm font-bold text-white">
            PQ
          </div>
          <span className="hidden text-lg font-semibold text-slate-900 sm:block">Pharma Q</span>
        </Link>

        <Link href={CATEGORIES_LINK} className="hidden shrink-0 items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-primary-600 lg:flex">
          <LayoutGrid className="h-4 w-4" /> Categories
        </Link>

        <form onSubmit={handleSearch} className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            ref={inputRef}
            type="search"
            name="q"
            defaultValue={searchParams.get("q") ?? ""}
            placeholder="Search for medicines, brands, suppliers..."
            className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm text-slate-700 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-400"
          />
        </form>

        <div className="flex shrink-0 items-center gap-1">
          {businessName ? (
            <>
              <Link href="/wishlist" className="hidden h-10 w-10 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-50 sm:flex">
                <Heart className="h-[18px] w-[18px]" />
              </Link>
              <Link href="/notifications" className="relative hidden h-10 w-10 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-50 sm:flex">
                <Bell className="h-[18px] w-[18px]" />
                {unreadCount > 0 && <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-danger-500" />}
              </Link>
              <Link href="/cart" className="relative flex h-10 w-10 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-50">
                <ShoppingCart className="h-[18px] w-[18px]" />
                {cartCount > 0 && (
                  <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary-600 px-1 text-[10px] font-semibold text-white">
                    {cartCount}
                  </span>
                )}
              </Link>
              <Dropdown
                trigger={
                  <button className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-slate-50">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-primary-700">
                      <User className="h-4 w-4" />
                    </div>
                    <span className="hidden text-sm font-medium text-slate-700 md:block">{businessName}</span>
                  </button>
                }
              >
                {(close) => (
                  <>
                    <DropdownItem onClick={() => { close(); router.push("/orders"); }}>
                      <Package className="h-4 w-4" /> My orders
                    </DropdownItem>
                    <DropdownItem onClick={() => { close(); router.push("/profile"); }}>
                      <User className="h-4 w-4" /> Business profile
                    </DropdownItem>
                    <DropdownItem onClick={handleLogout} className="text-danger-600 hover:bg-danger-50">
                      <LogOut className="h-4 w-4" /> Log out
                    </DropdownItem>
                  </>
                )}
              </Dropdown>
            </>
          ) : (
            <Link href="/login">
              <button className="h-10 rounded-lg bg-primary-600 px-4 text-sm font-medium text-white hover:bg-primary-700">
                Sign in
              </button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
