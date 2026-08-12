// Supabase's `.in(column, ids)` builds a GET request with every id in the
// URL — for a supplier with hundreds of products that URL exceeds request
// size limits and the whole query fails with a Bad Request. This runs the
// same fetch in bounded-size batches and merges the results.
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
