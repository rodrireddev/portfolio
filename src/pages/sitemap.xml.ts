import type { APIRoute } from 'astro';
import { getProjects } from '../lib/store';

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');

export const GET: APIRoute = async ({ site, url }) => {
  const base = (site ?? new URL(url.origin)).toString().replace(/\/$/, '');
  const projects = (await getProjects()).filter((p) => p.visible);
  const urls = [base + '/', ...projects.map((p) => `${base}/projects/${encodeURIComponent(p.slug)}`)];
  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
    .map((u) => `  <url><loc>${esc(u)}</loc></url>`)
    .join('\n')}\n</urlset>\n`;
  return new Response(body, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600' },
  });
};
