import type { APIRoute } from 'astro';
import { SESSION_COOKIE, SESSION_TTL, checkPassword, createSession } from '../../../lib/auth';
import { clientIp, json, readJson } from '../../../lib/http';
import { rateLimit } from '../../../lib/store';

export const POST: APIRoute = async ({ request, cookies, url }) => {
  const ip = clientIp(request);
  if (!(await rateLimit('login', ip, 8, 15 * 60))) {
    return json({ error: 'Too many attempts. Try again in a few minutes.' }, 429);
  }
  const body = await readJson(request);
  if (typeof body?.password !== 'string' || !(await checkPassword(body.password))) {
    return json({ error: 'Invalid password' }, 401);
  }
  cookies.set(SESSION_COOKIE, await createSession(), {
    httpOnly: true,
    secure: url.protocol === 'https:',
    sameSite: 'strict',
    path: '/',
    maxAge: SESSION_TTL,
  });
  return json({ ok: true });
};
