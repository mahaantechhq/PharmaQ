// Supabase's `.in(column, ids)` builds a GET request with every id in the
// URL — pass in a few hundred at once (e.g. "select all" on a large
// product list) and that URL exceeds request size limits, failing the
// whole query outright. This runs the same fetch in bounded-size batches
// and merges the results.
export async function fetchInChunks<TId, TRow>(
  ids: TId[],
  fetchChunk: (chunk: TId[]) => Promise<TRow[]>,
  chunkSize = 200,
): Promise<TRow[]> {
  const chunks: TId[][] = [];
  for (let i = 0; i < ids.length; i += chunkSize) {
    chunks.push(ids.slice(i, i + chunkSize));
  }

  const results = await Promise.all(chunks.map(fetchChunk));
  return results.flat();
}
