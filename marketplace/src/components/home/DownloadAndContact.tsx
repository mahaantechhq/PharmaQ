import { Smartphone, Mail, Phone, ArrowRight } from "lucide-react";

export function DownloadAndContact() {
  return (
    <>
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-900 via-primary-700 to-primary-500 p-10 sm:p-14">
          <div className="pointer-events-none absolute inset-0 bg-dot-grid opacity-30" />
          <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-accent-500/20 blur-3xl" />
          <div className="relative flex flex-col items-center gap-8 text-center sm:flex-row sm:justify-between sm:text-left">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-primary-100">
                <Smartphone className="h-3.5 w-3.5" /> Mobile app
              </span>
              <p className="mt-4 font-display text-2xl font-semibold text-white sm:text-3xl">Take Pharma Q with you</p>
              <p className="mt-2 max-w-md text-sm text-primary-100/90">Manage orders and browse suppliers on the go with our mobile app — coming soon.</p>
            </div>
            <div className="flex shrink-0 gap-3">
              <span className="rounded-xl border border-white/15 bg-white/10 px-5 py-3 text-sm font-semibold text-white backdrop-blur-sm">App Store — soon</span>
              <span className="rounded-xl border border-white/15 bg-white/10 px-5 py-3 text-sm font-semibold text-white backdrop-blur-sm">Google Play — soon</span>
            </div>
          </div>
        </div>
      </section>

      <section id="contact" className="mx-auto max-w-7xl px-4 pb-20 sm:px-6">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-[1.2fr_1fr]">
          <div className="rounded-2xl border border-slate-100 bg-white p-8 shadow-[var(--shadow-card)]">
            <p className="text-xs font-bold uppercase tracking-widest text-primary-600">Get in touch</p>
            <h2 className="mt-2 font-display text-2xl font-semibold text-slate-900">Need help getting started?</h2>
            <p className="mt-2 max-w-sm text-sm text-slate-500">Our team can help onboard your business onto Pharma Q.</p>
          </div>
          <div className="flex flex-col gap-4">
            <a href="mailto:support@pharmaq.in" className="group flex items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-white p-5 shadow-[var(--shadow-card)] transition-colors hover:border-primary-200">
              <span className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
                  <Mail className="h-4 w-4" />
                </span>
                <span>
                  <p className="text-xs text-slate-400">Email us</p>
                  <p className="text-sm font-semibold text-slate-800">support@pharmaq.in</p>
                </span>
              </span>
              <ArrowRight className="h-4 w-4 text-slate-300 transition-transform group-hover:translate-x-1 group-hover:text-primary-600" />
            </a>
            <a href="tel:18001234567" className="group flex items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-white p-5 shadow-[var(--shadow-card)] transition-colors hover:border-primary-200">
              <span className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
                  <Phone className="h-4 w-4" />
                </span>
                <span>
                  <p className="text-xs text-slate-400">Call us</p>
                  <p className="text-sm font-semibold text-slate-800">1800-123-4567</p>
                </span>
              </span>
              <ArrowRight className="h-4 w-4 text-slate-300 transition-transform group-hover:translate-x-1 group-hover:text-primary-600" />
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
