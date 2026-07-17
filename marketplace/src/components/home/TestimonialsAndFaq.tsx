"use client";

import { useState } from "react";
import { ChevronDown, Quote } from "lucide-react";
import { cn } from "@/lib/cn";

const TESTIMONIALS = [
  { name: "Anil Bhatia", business: "ABC Medicals", quote: "We found three new suppliers in our first week and cut our procurement time in half." },
  { name: "Kavita Rao", business: "XYZ Pharma Distributors", quote: "Being able to order from multiple suppliers in one checkout has saved us hours every month." },
  { name: "Rajesh Kumar", business: "Medicore Health", quote: "Transparent pricing and verified suppliers — exactly what our business needed." },
];

const FAQS = [
  { q: "Who can register on Pharma Q?", a: "Only businesses onboarded by the Pharma Q team can log in — there's no public self-signup, which keeps the marketplace verified." },
  { q: "Can I buy from multiple suppliers in one order?", a: "Yes. Add products from any number of suppliers to your cart — checkout automatically splits it into a separate order per supplier." },
  { q: "How is stock tracked?", a: "Every supplier manages batch-level inventory with expiry dates. Stock is always fulfilled from the earliest-expiring batch first." },
  { q: "Is GST handled automatically?", a: "Yes, every product carries its GST rate and invoices are generated with tax breakdowns included." },
];

export function TestimonialsAndFaq() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <>
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <h2 className="mb-8 text-center text-xl font-semibold text-slate-900">What businesses are saying</h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <div key={t.name} className="rounded-xl border border-slate-100 bg-white p-6 shadow-[var(--shadow-card)]">
              <Quote className="h-5 w-5 text-primary-200" />
              <p className="mt-3 text-sm text-slate-600">&ldquo;{t.quote}&rdquo;</p>
              <p className="mt-4 text-sm font-semibold text-slate-800">{t.name}</p>
              <p className="text-xs text-slate-400">{t.business}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="faq" className="bg-slate-50 py-12">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <h2 className="mb-8 text-center text-xl font-semibold text-slate-900">Frequently asked questions</h2>
          <div className="flex flex-col gap-2">
            {FAQS.map((faq, i) => (
              <div key={faq.q} className="rounded-xl border border-slate-100 bg-white">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="flex w-full items-center justify-between px-5 py-4 text-left text-sm font-medium text-slate-800"
                >
                  {faq.q}
                  <ChevronDown className={cn("h-4 w-4 text-slate-400 transition-transform", openFaq === i && "rotate-180")} />
                </button>
                {openFaq === i && <p className="px-5 pb-4 text-sm text-slate-500">{faq.a}</p>}
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
