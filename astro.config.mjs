// @ts-check
import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';

// Widths the Vercel image optimizer may produce (keep in sync with src/lib/image.ts).
const IMAGE_SIZES = [320, 480, 640, 828, 1200, 1600];

// Pages are rendered on demand so that content edited in the dashboard
// (stored in Redis) shows up without a rebuild.
export default defineConfig({
  output: 'server',
  adapter: vercel({
    imagesConfig: {
      sizes: IMAGE_SIZES,
      // Only screenshots uploaded through the dashboard (Vercel Blob) are optimized.
      remotePatterns: [{ protocol: 'https', hostname: '*.public.blob.vercel-storage.com' }],
      formats: ['image/avif', 'image/webp'],
      minimumCacheTTL: 60 * 60 * 24 * 30,
    },
  }),
  security: {
    checkOrigin: true,
    // Astro hashes its own scripts/styles, so no 'unsafe-inline' is needed.
    csp: {
      directives: [
        "default-src 'self'",
        "img-src 'self' data: https:",
        'frame-src https://challenges.cloudflare.com https://www.youtube-nocookie.com',
        "connect-src 'self' https://challenges.cloudflare.com",
        "font-src 'self' data:",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
      ],
      scriptDirective: { resources: ["'self'", 'https://challenges.cloudflare.com'] },
      styleDirective: { resources: ["'self'"] },
    },
  },
});
