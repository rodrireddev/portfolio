import type { APIRoute } from 'astro';
import { json, readJson } from '../../../lib/http';
import { getProjects, saveProjects } from '../../../lib/store';
import { sanitizeProjects } from '../../../lib/validate';

export const GET: APIRoute = async () => json(await getProjects());

/** Replaces the whole ordered list (array position = display order). */
export const PUT: APIRoute = async ({ request }) => {
  const body = await readJson(request);
  if (!Array.isArray(body)) return json({ error: 'Expected an array' }, 400);
  const projects = sanitizeProjects(body);
  await saveProjects(projects);
  return json(projects);
};
