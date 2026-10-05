import type { APIRoute } from 'astro';
import { json, readJson } from '../../../lib/http';
import { getProfile, saveProfile } from '../../../lib/store';
import { sanitizeProfile } from '../../../lib/validate';

export const GET: APIRoute = async () => json(await getProfile());

export const PUT: APIRoute = async ({ request }) => {
  const body = await readJson(request);
  if (!body) return json({ error: 'Invalid JSON' }, 400);
  const profile = sanitizeProfile(body);
  await saveProfile(profile);
  return json(profile);
};
