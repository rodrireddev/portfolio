import type { APIRoute } from 'astro';
import { json, readJson } from '../../../lib/http';
import { getMessages, saveMessages } from '../../../lib/store';

export const GET: APIRoute = async () => json(await getMessages());

/** Inbox update: ids to keep (others are deleted), ids to flag as read, ids to flag as unread. */
export const PUT: APIRoute = async ({ request }) => {
  const body = await readJson<{ keep?: string[]; read?: string[]; unread?: string[] }>(request);
  if (!Array.isArray(body?.keep) || !Array.isArray(body?.read)) return json({ error: 'Invalid body' }, 400);
  const keep = new Set(body.keep);
  const read = new Set(body.read);
  const unread = new Set(Array.isArray(body.unread) ? body.unread : []);
  const next = (await getMessages())
    .filter((m) => keep.has(m.id))
    .map((m) => ({ ...m, read: unread.has(m.id) ? false : m.read || read.has(m.id) }));
  await saveMessages(next);
  return json(next);
};
