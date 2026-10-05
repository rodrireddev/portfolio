/** Reads a server env var at runtime (Vercel) or from .env (local dev). */
export function env(key: string): string | undefined {
  const v = process.env[key] ?? (import.meta.env as Record<string, string | undefined>)[key];
  return v && v.length > 0 ? v : undefined;
}
