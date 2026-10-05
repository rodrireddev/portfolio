export const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

/**
 * Client IP from proxy headers. Do not use Astro.clientAddress: the Vercel adapter
 * throws when it is read. Vercel sets (and overwrites) these headers at the edge.
 */
export const clientIp = (request: Request) =>
  request.headers.get('x-vercel-forwarded-for')?.trim() ||
  request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
  request.headers.get('x-real-ip')?.trim() ||
  'unknown';

/** Parses a JSON body, returning null when it is missing or malformed. */
export async function readJson<T = any>(request: Request): Promise<T | null> {
  if (!request.headers.get('content-type')?.includes('application/json')) return null;
  try {
    return await request.json();
  } catch {
    return null;
  }
}
