export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-IN").format(value);
}

// Server components render on Vercel (UTC), so any date/time display needs
// an explicit timeZone or it silently shows UTC instead of India time --
// e.g. an order placed at 4:16pm IST would otherwise render as 10:46am.
export function formatDate(
  value: string | Date,
  opts: Intl.DateTimeFormatOptions = { day: "2-digit", month: "short", year: "numeric" },
): string {
  return new Date(value).toLocaleDateString("en-IN", { ...opts, timeZone: "Asia/Kolkata" });
}

export function formatDateTime(
  value: string | Date,
  opts: Intl.DateTimeFormatOptions = { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" },
): string {
  return new Date(value).toLocaleString("en-IN", { ...opts, timeZone: "Asia/Kolkata" });
}
