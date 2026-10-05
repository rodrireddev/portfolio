# Portfolio

Astro (SSR) + TypeScript + vanilla Web Components. Content is edited from `/admin` and stored in Redis.

## Local development

```bash
npm install
npm run dev        # .env is already copied from .env.example
```

Without Redis credentials, content is stored in `.data/db.json` and uploads in `public/uploads/`.
The dashboard is at `/admin` (password = `ADMIN_PASSWORD` in `.env`).
The default Turnstile keys are Cloudflare's always-pass test keys.

## Deploy to Vercel

1. Push the repo and import it in Vercel (Astro is auto-detected).
2. **Storage** tab → add **Upstash Redis** (Marketplace). It injects `KV_REST_API_URL` / `KV_REST_API_TOKEN`.
3. **Storage** tab → create a **Blob** store (injects `BLOB_READ_WRITE_TOKEN`) for screenshot uploads.
4. Cloudflare dashboard → **Turnstile** → add a widget for your domain → set `PUBLIC_TURNSTILE_SITE_KEY` and `TURNSTILE_SECRET_KEY`.
5. Set `ADMIN_PASSWORD` and `SESSION_SECRET` (`openssl rand -hex 32`).
6. Optional: `RESEND_API_KEY` + `CONTACT_TO_EMAIL` to also get contact messages by email (they always appear in the dashboard inbox).

## Structure

- `src/pages/` — public site, `/admin`, and `api/` routes
- `src/scripts/public.ts` — web components: nav, theme toggle, project filter, gallery/lightbox, YouTube facade, contact form + Turnstile
- `src/scripts/admin.ts` — dashboard web components
- `src/lib/store.ts` — Redis / file storage; `validate.ts` — input sanitizing; `auth.ts` — signed-cookie session
