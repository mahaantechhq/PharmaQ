import { Smartphone, Mail, Phone } from "lucide-react";

export function DownloadAndContact() {
  return (
    <>
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="flex flex-col items-center gap-6 rounded-2xl bg-gradient-to-br from-primary-700 to-primary-500 p-10 text-center sm:flex-row sm:justify-between sm:text-left">
          <div>
            <p className="flex items-center justify-center gap-2 text-lg font-semibold text-white sm:justify-start">
              <Smartphone className="h-5 w-5" /> Take Pharma Q with you
            </p>
            <p className="mt-1 text-sm text-primary-100">Manage orders and browse suppliers on the go with our mobile app — coming soon.</p>
          </div>
          <div className="flex gap-3">
            <span className="rounded-lg bg-white/10 px-4 py-2 text-sm font-medium text-white">App Store — soon</span>
            <span className="rounded-lg bg-white/10 px-4 py-2 text-sm font-medium text-white">Google Play — soon</span>
          </div>
        </div>
      </section>

      <section id="contact" className="mx-auto max-w-7xl px-4 pb-16 sm:px-6">
        <div className="rounded-2xl border border-slate-100 bg-white p-8 text-center shadow-[var(--shadow-card)]">
          <h2 className="text-xl font-semibold text-slate-900">Need help getting started?</h2>
          <p className="mt-2 text-sm text-slate-500">Our team can help onboard your business onto Pharma Q.</p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-6 text-sm text-slate-600">
            <span className="flex items-center gap-2"><Mail className="h-4 w-4 text-primary-500" /> support@pharmaq.in</span>
            <span className="flex items-center gap-2"><Phone className="h-4 w-4 text-primary-500" /> 1800-123-4567</span>
          </div>
        </div>
      </section>
    </>
  );
}
