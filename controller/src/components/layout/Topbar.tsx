"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search, Bell, LogOut, User } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Dropdown, DropdownItem } from "@/components/ui/Dropdown";

export function Topbar({ email, pendingApprovals = 0 }: { email: string; pendingApprovals?: number }) {
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-slate-100 bg-white/80 px-6 backdrop-blur">
      <div className="relative flex-1 max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="search"
          placeholder="Search businesses, orders..."
          className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm text-slate-700 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-400"
        />
      </div>

      <div className="flex items-center gap-2">
        <Link
          href="/businesses?status=pending"
          className="relative flex h-10 w-10 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-50"
        >
          <Bell className="h-[18px] w-[18px]" />
          {pendingApprovals > 0 && (
            <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger-500 px-1 text-[10px] font-semibold text-white">
              {pendingApprovals}
            </span>
          )}
        </Link>

        <Dropdown
          trigger={
            <button className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-slate-50">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-primary-700">
                <User className="h-4 w-4" />
              </div>
              <div className="hidden text-left sm:block">
                <p className="text-sm font-medium text-slate-800 leading-tight">Super Admin</p>
                <p className="text-xs text-slate-400 leading-tight">{email}</p>
              </div>
            </button>
          }
        >
          {() => (
            <DropdownItem onClick={handleLogout} className="text-danger-600 hover:bg-danger-50">
              <LogOut className="h-4 w-4" /> Log out
            </DropdownItem>
          )}
        </Dropdown>
      </div>
    </header>
  );
}
