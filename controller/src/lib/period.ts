// The subscription period key is the first day of the current calendar
// month in IST (not UTC -- Vercel renders in UTC, so late-evening IST on
// the last day of a month would otherwise land in the wrong period).
export function currentPeriod(): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
  }).formatToParts(new Date());
  const year = parts.find((p) => p.type === "year")!.value;
  const month = parts.find((p) => p.type === "month")!.value;
  return `${year}-${month}-01`;
}
