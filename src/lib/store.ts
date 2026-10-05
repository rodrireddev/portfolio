import { Redis } from '@upstash/redis';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { env } from './env';
import { defaultProfile, defaultProjects } from './defaults';
import type { Message, Profile, Project } from './types';

/**
 * Storage with two interchangeable backends:
 *  - Upstash Redis (production, Vercel Marketplace)
 *  - a JSON file in .data/ (local dev, when no Redis credentials are set)
 */
interface Backend {
  get<T>(key: string): Promise<T | null>;
  set(key: string, value: unknown): Promise<void>;
  /** Increment a counter that expires after `ttl` seconds. */
  hit(key: string, ttl: number): Promise<number>;
}

function redisBackend(url: string, token: string): Backend {
  const r = new Redis({ url, token });
  return {
    get: (k) => r.get(k),
    set: async (k, v) => void (await r.set(k, v)),
    hit: async (k, ttl) => {
      const n = await r.incr(k);
      if (n === 1) await r.expire(k, ttl);
      return n;
    },
  };
}

function fileBackend(): Backend {
  const file = path.resolve('.data/db.json');
  const hits = new Map<string, { n: number; exp: number }>();
  const read = async (): Promise<Record<string, unknown>> => {
    try {
      return JSON.parse(await fs.readFile(file, 'utf8'));
    } catch {
      return {};
    }
  };
  return {
    get: async <T>(k: string) => ((await read())[k] as T) ?? null,
    set: async (k, v) => {
      const db = { ...(await read()), [k]: v };
      await fs.mkdir(path.dirname(file), { recursive: true });
      await fs.writeFile(file, JSON.stringify(db, null, 2));
    },
    hit: async (k, ttl) => {
      const now = Date.now();
      const cur = hits.get(k);
      const e = cur && cur.exp > now ? cur : { n: 0, exp: now + ttl * 1000 };
      e.n++;
      hits.set(k, e);
      return e.n;
    },
  };
}

const url = env('KV_REST_API_URL') ?? env('UPSTASH_REDIS_REST_URL');
const token = env('KV_REST_API_TOKEN') ?? env('UPSTASH_REDIS_REST_TOKEN');
export const usingRedis = !!(url && token);
const db: Backend = usingRedis ? redisBackend(url!, token!) : fileBackend();

const K = { profile: 'portfolio:profile', projects: 'portfolio:projects', messages: 'portfolio:messages' };

export async function getProfile(): Promise<Profile> {
  return { ...defaultProfile, ...((await db.get<Profile>(K.profile)) ?? {}) };
}
export const saveProfile = (p: Profile) => db.set(K.profile, p);

export async function getProjects(): Promise<Project[]> {
  return (await db.get<Project[]>(K.projects)) ?? defaultProjects;
}
export const saveProjects = (p: Project[]) => db.set(K.projects, p);

export async function getMessages(): Promise<Message[]> {
  return (await db.get<Message[]>(K.messages)) ?? [];
}
export const saveMessages = (m: Message[]) => db.set(K.messages, m.slice(0, 200));
export async function addMessage(m: Pick<Message, 'name' | 'email' | 'message'>) {
  const full: Message = { ...m, id: crypto.randomUUID(), createdAt: new Date().toISOString(), read: false };
  await saveMessages([full, ...(await getMessages())]);
  return full;
}

/** Returns false once `ip` exceeded `max` hits for `bucket` within `ttl` seconds. */
export const rateLimit = async (bucket: string, ip: string, max: number, ttl: number) =>
  (await db.hit(`portfolio:rl:${bucket}:${ip}`, ttl)) <= max;
