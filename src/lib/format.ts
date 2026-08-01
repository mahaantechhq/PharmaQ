export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
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

// Product batch expiry dates specifically use D-M-YY (e.g. "1-5-26"), unlike
// formatDate's "31 Dec 2027" style used everywhere else in the app.
export function formatExpiryDate(value: string | Date): string {
  const parts = new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "numeric",
    year: "2-digit",
    timeZone: "Asia/Kolkata",
  }).formatToParts(new Date(value));
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return `${get("day")}-${get("month")}-${get("year")}`;
}

export function formatDateTime(
  value: string | Date,
  opts: Intl.DateTimeFormatOptions = { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" },
): string {
  return new Date(value).toLocaleString("en-IN", { ...opts, timeZone: "Asia/Kolkata" });
}
