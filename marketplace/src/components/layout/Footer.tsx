import Link from "next/link";
import Image from "next/image";
import { Mail, Phone, MapPin } from "lucide-react";

const LINK_GROUPS = [
  {
    title: "Marketplace",
    links: [
      { label: "Search products", href: "/search" },
      { label: "Categories", href: "/search" },
      { label: "How it works", href: "/#how-it-works" },
    ],
  },
  {
    title: "For businesses",
    links: [
      { label: "Your orders", href: "/orders" },
      { label: "Wallet", href: "/wallet" },
      { label: "Business profile", href: "/profile" },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "Contact us", href: "/#contact" },
      { label: "FAQ", href: "/#faq" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-slate-100 bg-slate-50">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-4 py-12 sm:px-6 md:grid-cols-4">
        <div className="col-span-2 md:col-span-1">
          <div className="mb-3">
            <Image src="/logo.png" alt="Pharma Q" width={130} height={35} />
          </div>
          <p className="text-sm text-slate-500">
            The B2B marketplace connecting pharma businesses across India.
          </p>
          <div className="mt-4 flex flex-col gap-2 text-sm text-slate-500">
            <span className="flex items-center gap-2"><Mail className="h-4 w-4" /> mahaantech26@gmail.com</span>
            <span className="flex items-center gap-2"><Phone className="h-4 w-4" /> +91 82200 65565</span>
            <span className="flex items-center gap-2"><MapPin className="h-4 w-4" /> Trichy, Tamil Nadu, India</span>
          </div>
        </div>

        {LINK_GROUPS.map((group) => (
          <div key={group.title}>
            <p className="mb-3 text-sm font-semibold text-slate-800">{group.title}</p>
            <div className="flex flex-col gap-2">
              {group.links.map((link) => (
                <Link key={link.label} href={link.href} className="text-sm text-slate-500 hover:text-primary-600">
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="border-t border-slate-200 py-4 text-center text-xs text-slate-400">
        © {new Date().getFullYear()} Pharma Q. All rights reserved.
      </div>
    </footer>
  );
}
