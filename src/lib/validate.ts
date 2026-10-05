import type { Message, Profile, Project } from './types';
import { defaultProfile } from './defaults';

const str = (v: unknown, max = 200): string => (typeof v === 'string' ? v.trim().slice(0, max) : '');

/** Only http(s) URLs or site-relative paths are allowed (blocks javascript: etc). */
export function safeUrl(v: unknown, allowRelative = false): string {
  const s = str(v, 2000);
  if (!s) return '';
  if (allowRelative && s.startsWith('/') && !s.startsWith('//')) return s;
  try {
    const u = new URL(s);
    return u.protocol === 'http:' || u.protocol === 'https:' ? u.toString() : '';
  } catch {
    return '';
  }
}

export function safeEmail(v: unknown): string {
  const s = str(v, 254);
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s) ? s : '';
}

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

const arr = <T>(v: unknown, max: number, fn: (x: unknown) => T | null): T[] =>
  Array.isArray(v) ? v.slice(0, max).map(fn).filter((x): x is T => x !== null) : [];

export function sanitizeProfile(input: any): Profile {
  const d = defaultProfile;
  return {
    siteTitle: str(input?.siteTitle, 120) || d.siteTitle,
    siteDescription: str(input?.siteDescription, 300),
    name: str(input?.name, 80) || d.name,
    role: str(input?.role, 120),
    tagline: str(input?.tagline, 300),
    bio: str(input?.bio, 5000),
    avatarUrl: safeUrl(input?.avatarUrl, true),
    location: str(input?.location, 80),
    email: safeEmail(input?.email),
    availability: str(input?.availability, 120),
    resumeUrl: safeUrl(input?.resumeUrl, true),
    socials: arr(input?.socials, 12, (s: any) => {
      const url = safeUrl(s?.url);
      const label = str(s?.label, 40);
      return url && label ? { label, url } : null;
    }),
    skills: arr(input?.skills, 12, (g: any) => {
      const group = str(g?.group, 40);
      const items = arr(g?.items, 30, (i) => str(i, 40) || null);
      return group ? { group, items } : null;
    }),
    experience: arr(input?.experience, 20, (e: any) => {
      const company = str(e?.company, 80);
      return company
        ? { company, role: str(e?.role, 100), period: str(e?.period, 60), description: str(e?.description, 1000) }
        : null;
    }),
  };
}

export function sanitizeProject(input: any): Project | null {
  const title = str(input?.title, 120);
  if (!title) return null;
  const slug = slugify(str(input?.slug, 80) || title) || 'project';
  return {
    id: str(input?.id, 40) || crypto.randomUUID(),
    slug,
    title,
    summary: str(input?.summary, 300),
    description: str(input?.description, 8000),
    kind: input?.kind === 'team' ? 'team' : 'personal',
    role: str(input?.role, 100),
    year: str(input?.year, 20),
    tags: arr(input?.tags, 15, (t) => str(t, 30) || null),
    images: arr(input?.images, 20, (i: any) => {
      const url = safeUrl(i?.url, true);
      return url ? { url, alt: str(i?.alt, 200) } : null;
    }),
    youtubeUrl: safeUrl(input?.youtubeUrl),
    repoUrl: safeUrl(input?.repoUrl),
    liveUrl: safeUrl(input?.liveUrl),
    featured: !!input?.featured,
    visible: input?.visible !== false,
  };
}

/** Sanitizes the whole list and guarantees unique slugs. */
export function sanitizeProjects(input: unknown): Project[] {
  const seen = new Set<string>();
  return arr(input, 100, sanitizeProject).map((p) => {
    let slug = p.slug;
    for (let n = 2; seen.has(slug); n++) slug = `${p.slug}-${n}`;
    seen.add(slug);
    return { ...p, slug };
  });
}

export function sanitizeMessage(input: {
  name: unknown;
  email: unknown;
  message: unknown;
}): Pick<Message, 'name' | 'email' | 'message'> | null {
  const name = str(input.name, 100);
  const email = safeEmail(input.email);
  const message = str(input.message, 4000);
  return name && email && message.length >= 10 ? { name, email, message } : null;
}

/** Extracts the 11-char video id from any common YouTube URL. */
export function youtubeId(url: string): string | null {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, '');
    let id: string | null = null;
    if (host === 'youtu.be') id = u.pathname.slice(1);
    else if (host.endsWith('youtube.com') || host.endsWith('youtube-nocookie.com')) {
      id = u.searchParams.get('v') ?? u.pathname.match(/^\/(?:embed|shorts|live)\/([^/]+)/)?.[1] ?? null;
    }
    return id && /^[\w-]{11}$/.test(id) ? id : null;
  } catch {
    return null;
  }
}
