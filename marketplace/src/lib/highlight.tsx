function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Splits text on the query (case-insensitive) and wraps matches in <mark>,
// used to highlight what the user searched for in product names.
export function highlightMatch(text: string, query?: string) {
  const trimmed = query?.trim();
  if (!trimmed) return text;

  const parts = text.split(new RegExp(`(${escapeRegExp(trimmed)})`, "gi"));
  if (parts.length === 1) return text;

  return parts.map((part, i) =>
    part.toLowerCase() === trimmed.toLowerCase() ? (
      <mark key={i} className="rounded bg-accent-50 font-semibold text-accent-600">
        {part}
      </mark>
    ) : (
      part
    ),
  );
}
