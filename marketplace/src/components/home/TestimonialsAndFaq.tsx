"use client";

import { useState } from "react";
import { ChevronDown, Quote } from "lucide-react";
import { cn } from "@/lib/cn";

const TESTIMONIALS = [
  { name: "Anil Bhatia", business: "ABC Medicals", quote: "We found three new suppliers in our first week and cut our procurement time in half.", offset: false },
  { name: "Kavita Rao", business: "XYZ Pharma Distributors", quote: "Being able to order from multiple suppliers in one checkout has saved us hours every month.", offset: true },
  { name: "Rajesh Kumar", business: "Medicore Health", quote: "Transparent pricing and verified suppliers — exactly what our business needed.", offset: false },
];

const AVATAR_ACCENTS = ["bg-primary-600", "bg-accent-500", "bg-success-600"];

const FAQS = [
  { q: "Who can register on Pharma Q?", a: "Only businesses onboarded by the Pharma Q team can log in — there's no public self-signup, which keeps the marketplace verified." },
  { q: "Can I buy from multiple suppliers in one order?", a: "Yes. Add products from any number of suppliers to your cart — checkout automatically splits it into a separate order per supplier." },
  { q: "How is stock tracked?", a: "Every supplier manages batch-level inventory with expiry dates. Stock is always fulfilled from the earliest-expiring batch first." },
  { q: "Is GST handled automatically?", a: "Yes, every product carries its GST rate and invoices are generated with tax breakdowns included." },
];

function initials(name: string) {
  return name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();
}

export function TestimonialsAndFaq() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <>
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="mb-12 text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-primary-600">Testimonials</p>
          <h2 className="mt-2 font-display text-2xl font-semibold text-slate-900 sm:text-3xl">What businesses are saying</h2>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          {TESTIMONIALS.map((t, i) => (
            <div
              key={t.name}
              className={cn(
                "relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-7 shadow-[var(--shadow-card)] transition-all duration-200 hover:-translate-y-1 hover:shadow-[var(--shadow-elevated)]",
                t.offset && "sm:mt-8",
              )}
            >
              <Quote className="absolute -right-2 -top-2 h-20 w-20 text-primary-50" strokeWidth={1} />
              <p className="relative text-sm leading-relaxed text-slate-600">&ldquo;{t.quote}&rdquo;</p>
              <div className="relative mt-6 flex items-center gap-3">
                <div className={cn("flex h-10 w-10 items-center justify-center rounded-full font-display text-sm font-bold text-white", AVATAR_ACCENTS[i % AVATAR_ACCENTS.length])}>
                  {initials(t.name)}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">{t.name}</p>
                  <p className="text-xs text-slate-400">{t.business}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="faq" className="bg-slate-50 py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <div className="mb-10 text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-primary-600">Support</p>
            <h2 className="mt-2 font-display text-2xl font-semibold text-slate-900 sm:text-3xl">Frequently asked questions</h2>
          </div>
          <div className="flex flex-col gap-3">
            {FAQS.map((faq, i) => (
              <div
                key={faq.q}
                className={cn(
                  "rounded-2xl border bg-white transition-colors",
                  openFaq === i ? "border-primary-200 shadow-[var(--shadow-card)]" : "border-slate-100",
                )}
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="flex w-full items-center justify-between gap-4 px-6 py-4 text-left text-sm font-semibold text-slate-800"
                >
                  {faq.q}
                  <span className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-colors", openFaq === i ? "bg-primary-600 text-white" : "bg-slate-100 text-slate-400")}>
                    <ChevronDown className={cn("h-4 w-4 transition-transform", openFaq === i && "rotate-180")} />
                  </span>
                </button>
                {openFaq === i && <p className="px-6 pb-5 text-sm leading-relaxed text-slate-500">{faq.a}</p>}
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
