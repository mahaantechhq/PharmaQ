import Link from "next/link";
import Image from "next/image";
import { Building2, Store, ArrowRight } from "lucide-react";

const WHOLESALER_LOGIN_URL = "https://business.pharmaq.in/login";

export default function GetStartedPage() {
  return (
    <div className="flex min-h-screen flex-1 items-center justify-center bg-gradient-to-br from-primary-900 via-primary-700 to-primary-500 p-4">
      <div className="w-full max-w-2xl">
        <Link href="/" className="mb-8 flex flex-col items-center text-white">
          <Image src="/logo-icon.png" alt="Pharma Q" width={64} height={64} className="mb-3" priority />
          <h1 className="text-xl font-semibold">Pharma Q</h1>
          <p className="mt-1 text-sm text-primary-100">B2B Pharma Marketplace</p>
        </Link>

        <div className="rounded-2xl bg-white p-8 shadow-2xl">
          <h2 className="mb-1 text-center text-lg font-semibold text-slate-900">Sign in as</h2>
          <p className="mb-6 text-center text-sm text-slate-500">Choose your business type to continue.</p>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Link
              href="/login"
              className="group flex flex-col items-center gap-3 rounded-xl border border-slate-200 p-6 text-center transition-colors hover:border-primary-400 hover:bg-primary-50"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-50 text-primary-600 group-hover:bg-primary-100">
                <Store className="h-6 w-6" />
              </span>
              <span className="text-base font-semibold text-slate-900">Retailer</span>
              <span className="text-sm text-slate-500">Pharmacy owner ordering stock</span>
              <span className="mt-1 flex items-center gap-1 text-sm font-medium text-primary-600">
                Continue <ArrowRight className="h-4 w-4" />
              </span>
            </Link>

            <a
              href={WHOLESALER_LOGIN_URL}
              className="group flex flex-col items-center gap-3 rounded-xl border border-slate-200 p-6 text-center transition-colors hover:border-primary-400 hover:bg-primary-50"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-50 text-primary-600 group-hover:bg-primary-100">
                <Building2 className="h-6 w-6" />
              </span>
              <span className="text-base font-semibold text-slate-900">Wholesaler</span>
              <span className="text-sm text-slate-500">Distributor managing your catalog</span>
              <span className="mt-1 flex items-center gap-1 text-sm font-medium text-primary-600">
                Continue <ArrowRight className="h-4 w-4" />
              </span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
