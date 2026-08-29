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

// product_batches.scheme holds "0" or "Nil" for batches with no real trade
// scheme (bulk-upload placeholder values), not null -- so a plain truthy
// check would render those as if they were a real scheme like "4+1".
export function hasScheme(scheme: string | null | undefined): scheme is string {
  if (!scheme) return false;
  const trimmed = scheme.trim().toLowerCase();
  return trimmed !== "" && trimmed !== "0" && trimmed !== "nil";
}

// Trade schemes are entered as "buy+free" (e.g. "12+1" = order 12, get 1
// free). Used to prompt a retailer who's short of the threshold to top up
// their quantity and actually earn the free units instead of missing them.
export function parseScheme(scheme: string | null | undefined): { buy: number; free: number } | null {
  if (!hasScheme(scheme)) return null;
  const match = scheme.trim().match(/^(\d+)\s*\+\s*(\d+)$/);
  if (!match) return null;
  const buy = Number(match[1]);
  const free = Number(match[2]);
  if (!buy || !free) return null;
  return { buy, free };
}

export function formatDateTime(
  value: string | Date,
  opts: Intl.DateTimeFormatOptions = { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" },
): string {
  return new Date(value).toLocaleString("en-IN", { ...opts, timeZone: "Asia/Kolkata" });
}
