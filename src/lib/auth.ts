import { env } from './env';

export const SESSION_COOKIE = 'pf_session';
export const SESSION_TTL = 60 * 60 * 24 * 7; // 7 days

const enc = new TextEncoder();

async function hmac(data: string): Promise<string> {
  const secret = env('SESSION_SECRET');
  if (!secret || secret.length < 16) throw new Error('SESSION_SECRET must be set (16+ chars)');
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(data));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** Constant-time string comparison (both sides hashed to equal length first). */
async function safeEqual(a: string, b: string): Promise<boolean> {
  const [x, y] = await Promise.all([hmac('cmp:' + a), hmac('cmp:' + b)]);
  let diff = 0;
  for (let i = 0; i < x.length; i++) diff |= x.charCodeAt(i) ^ y.charCodeAt(i);
  return diff === 0;
}

export async function checkPassword(input: string): Promise<boolean> {
  const expected = env('ADMIN_PASSWORD');
  if (!expected) return false;
  return safeEqual(input, expected);
}

export async function createSession(): Promise<string> {
  const exp = Math.floor(Date.now() / 1000) + SESSION_TTL;
  return `${exp}.${await hmac('session:' + exp)}`;
}

export async function verifySession(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  const [exp, sig] = token.split('.');
  if (!exp || !sig || Number(exp) < Date.now() / 1000) return false;
  try {
    return await safeEqual(sig, await hmac('session:' + exp));
  } catch {
    return false;
  }
}
