import type { APIRoute } from 'astro';

export const GET: APIRoute = ({ site, url }) => {
  const base = (site ?? new URL(url.origin)).toString().replace(/\/$/, '');
  const body = ['User-agent: *', 'Allow: /', 'Disallow: /admin', 'Disallow: /api/', '', `Sitemap: ${base}/sitemap.xml`, ''].join('\n');
  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, s-maxage=3600' },
  });
};
