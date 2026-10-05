/** Keep in sync with IMAGE_SIZES in astro.config.mjs. */
const SIZES = [320, 480, 640, 828, 1200, 1600];

const BLOB_HOST = /\.public\.blob\.vercel-storage\.com$/;

function canOptimize(url: string): boolean {
  if (!import.meta.env.PROD || !url.startsWith('https://')) return false;
  try {
    const { hostname, pathname } = new URL(url);
    return BLOB_HOST.test(hostname) && !/\.(gif|svg)$/i.test(pathname); // keep GIF animation
  } catch {
    return false;
  }
}

/** Returns a Vercel-optimized URL (AVIF/WebP, resized) for dashboard uploads; other URLs pass through. */
export function optimized(url: string, width: number): string {
  if (!canOptimize(url)) return url;
  const w = SIZES.find((s) => s >= width) ?? SIZES[SIZES.length - 1];
  return `/_vercel/image?url=${encodeURIComponent(url)}&w=${w}&q=75`;
}

/** `srcset` value for the given widths, or undefined when the image cannot be optimized. */
export function srcset(url: string, widths: number[]): string | undefined {
  return canOptimize(url) ? widths.map((w) => `${optimized(url, w)} ${w}w`).join(', ') : undefined;
}
