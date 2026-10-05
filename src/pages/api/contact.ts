import type { APIRoute } from 'astro';
import { env } from '../../lib/env';
import { clientIp, json, readJson } from '../../lib/http';
import { addMessage, rateLimit } from '../../lib/store';
import { sanitizeMessage } from '../../lib/validate';

export const prerender = false;

async function verifyTurnstile(token: string, ip: string): Promise<boolean> {
  const secret = env('TURNSTILE_SECRET_KEY');
  if (!secret) return false;
  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    body: new URLSearchParams({ secret, response: token, remoteip: ip }),
  }).catch(() => null);
  return !!res?.ok && !!(await res.json().catch(() => null))?.success;
}

async function notifyByEmail(m: { name: string; email: string; message: string }) {
  const key = env('RESEND_API_KEY');
  const to = env('CONTACT_TO_EMAIL');
  if (!key || !to) return;
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: env('CONTACT_FROM_EMAIL') ?? 'Portfolio <onboarding@resend.dev>',
      to,
      reply_to: m.email,
      subject: `New portfolio message from ${m.name}`.replace(/[\r\n]/g, ' '),
      text: `${m.message}\n\n— ${m.name} <${m.email}>`,
    }),
  }).catch(() => {});
}

export const POST: APIRoute = async ({ request }) => {
  const ip = clientIp(request);
  const body = await readJson(request);
  if (!body) return json({ error: 'Invalid request' }, 400);

  // Honeypot: bots fill hidden fields. Pretend success so they do not retry.
  if (body.website) return json({ ok: true });

  if (!(await rateLimit('contact', ip, 5, 60 * 60))) {
    return json({ error: 'Too many messages. Please try again later.' }, 429);
  }
  if (typeof body.token !== 'string' || !(await verifyTurnstile(body.token, ip))) {
    return json({ error: 'Captcha verification failed. Please try again.' }, 400);
  }
  const msg = sanitizeMessage(body);
  if (!msg) return json({ error: 'Please fill in all fields (message: at least 10 characters).' }, 422);

  await addMessage(msg);
  await notifyByEmail(msg);
  return json({ ok: true });
};
