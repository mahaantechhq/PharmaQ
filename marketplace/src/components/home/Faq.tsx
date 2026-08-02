"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";

const FAQS = [
  { q: "Who can register on Pharma Q?", a: "Only businesses onboarded by the Pharma Q team can log in — there's no public self-signup, which keeps the marketplace verified." },
  { q: "Can I buy from multiple suppliers in one order?", a: "Yes. Add products from any number of suppliers to your cart — checkout automatically splits it into a separate order per supplier." },
  { q: "How is stock tracked?", a: "Every supplier manages batch-level inventory with expiry dates. Stock is always fulfilled from the earliest-expiring batch first." },
  { q: "Is GST handled automatically?", a: "Yes, every product carries its GST rate and invoices are generated with tax breakdowns included." },
];

export function Faq() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <>
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
