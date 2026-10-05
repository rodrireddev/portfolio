import type { APIRoute } from 'astro';
import { put } from '@vercel/blob';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { env } from '../../../lib/env';
import { json } from '../../../lib/http';

const TYPES: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/avif': 'avif',
};
const MAX_BYTES = 4 * 1024 * 1024; // Vercel functions accept ~4.5 MB request bodies

export const POST: APIRoute = async ({ request }) => {
  const file = (await request.formData().catch(() => null))?.get('file');
  if (!(file instanceof File)) return json({ error: 'No file received' }, 400);
  const ext = TYPES[file.type];
  if (!ext) return json({ error: 'Only PNG, JPEG, WebP, GIF or AVIF images are allowed' }, 415);
  if (file.size > MAX_BYTES) return json({ error: 'Image must be 4 MB or smaller' }, 413);

  const name = `portfolio/${crypto.randomUUID()}.${ext}`;

  if (env('BLOB_READ_WRITE_TOKEN')) {
    const blob = await put(name, file, { access: 'public', contentType: file.type });
    return json({ url: blob.url });
  }

  // Local development fallback: store under public/uploads.
  const dest = path.resolve('public/uploads', path.basename(name));
  await fs.mkdir(path.dirname(dest), { recursive: true });
  await fs.writeFile(dest, Buffer.from(await file.arrayBuffer()));
  return json({ url: `/uploads/${path.basename(name)}` });
};
