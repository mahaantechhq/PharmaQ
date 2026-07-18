"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ShoppingCart, Heart, Bell, User, LogOut, Package } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Dropdown, DropdownItem } from "@/components/ui/Dropdown";

const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "How it works", href: "/#how-it-works" },
  { label: "Testimonials", href: "/#testimonials" },
  { label: "FAQ", href: "/#faq" },
  { label: "Contact", href: "/#contact" },
];

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
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-40 border-b border-slate-100 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-4 sm:px-6">
        <Link href="/" className="flex shrink-0 items-center">
          <Image src="/logo-icon.png" alt="Pharma Q" width={36} height={36} className="rounded-lg sm:hidden" priority />
          <Image src="/logo.png" alt="Pharma Q" width={130} height={35} className="hidden sm:block" priority />
        </Link>

        <nav className="hidden items-center gap-7 lg:flex">
          {NAV_LINKS.map((link) => (
            <Link key={link.label} href={link.href} className="text-sm font-medium text-slate-600 transition-colors hover:text-primary-600">
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-1">
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
