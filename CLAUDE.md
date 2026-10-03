

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A **white-label digital catalog + admin panel** template. The conversion goal is **a pre-filled WhatsApp message, not an online checkout**: every product's CTA builds a `wa.me` deep link.

It is **cloned and deployed separately per client** (each instance has its own DB, Supabase Storage and domain). Per-instance branding (name, logo, colors, contact, currency, legal) lives in a **`SiteSettings` singleton** editable from `/admin/configuracion` — **not** in code. It is **not** multi-tenant (no `tenantId`); one deployment per client keeps each catalog light and isolated.

The first instance is **Corporación Milán** (Peru industrial/agricultural supplies); its data lives only in its DB, not in this code.

Specs: `docs/00-spec.md` (business, instance base), `docs/01-plan-tecnico.md` (architecture), `docs/03-spec-plantilla.md` (white-label conversion), `docs/02-tasks.md` (tasks).

Repo layout: `docs/` (specs) and `web/` (the Next.js app). **All commands run from `web/`.**

## Commands (run inside `web/`)

| Command | Purpose |
|---------|---------|
| `npm run dev` | Dev server (Turbopack) at http://localhost:3000 |
| `npm run build` | `prisma generate` then `next build` |
| `npm run lint` | ESLint |
| `npm run db:migrate` | `prisma migrate dev` (needs a live DB + `DIRECT_URL`) |
| `npm run db:seed` | `tsx prisma/seed.ts` — seeds admin + a neutral `SiteSettings` row. **No categories/products** (each instance creates its own). |
| `npm run db:setup` | migrate + seed in one step |
| `npm run db:studio` | Prisma Studio |

Admin login (seeded): `ADMIN_EMAIL` / `ADMIN_PASSWORD` from env.

## Critical framework caveat

This is **Next.js 16 (App Router) + React 19 + Tailwind 4** — a version with breaking changes vs. older training data. Per `web/AGENTS.md`: **read the relevant guide in `node_modules/next/dist/docs/` before writing Next.js code**, and heed deprecations (e.g. `middleware` is being deprecated in favor of `proxy`). The frontend renders plain `<img>` (see `ProductImage.tsx`), not `next/image`, so remote image hosts need no `next.config` allowlist.

## Data layer — mid-migration (read before touching DB or images)

The project is moving **from local SQLite → Supabase Postgres**, and **from filesystem photo storage → Supabase Storage**.

- `prisma/schema.prisma` may be **temporarily set to `provider = "sqlite"`** for local frontend preview against the seeded `prisma/dev.db`. The real production target is `provider = "postgresql"` with a `directUrl` (Supabase pooled URL on port 6543 for runtime, direct 5432 for migrations). Check the datasource block before running migrations — don't assume.
- Photos: `src/lib/images.ts` compresses with `sharp` (3 WebP variants + a JPEG fallback) and uploads to a **public Supabase Storage bucket** via `src/lib/supabase.ts` (`getSupabaseAdmin()`, a lazily-created service-role client). It no longer writes to `public/uploads`. `ProductImage` DB rows store full public URLs; `deleteImageFiles` derives the object key back from the URL.
- Switching the Prisma `provider` requires re-running `npx prisma generate`. SQLite and Postgres migrations are not interchangeable — the `prisma/migrations/` folder is regenerated per target DB.

## Architecture

**`src/lib/` is the core.** Route files stay thin and delegate here:
- `db.ts` — Prisma singleton (guards against hot-reload connection leaks).
- `catalog.ts` — **all read queries** (home, category, product, search, sitemap, admin stats). Empty categories are hidden from the home grid (`products: { some: {} }`). Search is a **PostgreSQL `pg_trgm` fuzzy search**: a `$queryRaw` runs `similarity()` over `concat_ws(' ', name, description, measure, gauge, material, category.name)` (threshold 0.08, ordered by score, limit 50), backed by a GIN index on `Product.name`. `normalizeSearch` only lowercases and strips accents from the query before the raw query — it is not the matcher itself.
- `auth.ts` — JWT (`jose`, HS256) in an httpOnly cookie (`cm_session`), bcrypt password hashing. Single admin. Sliding 30-day session tracked via `Admin.lastActiveAt`. Helpers: `createSession`, `getSession`, `requireAdmin` (redirects to login).
- `whatsapp.ts` — builds the `wa.me` deep link with a pre-filled quote message (receives WhatsApp number + price label + currency from `SiteSettings`). This is the product's conversion mechanism.
- `settings.ts` — **`getSiteSettings()`** (React-`cache()`d) reads the `SiteSettings` singleton (`id="default"`), with `DEFAULT_SETTINGS` fallback. Every branding/contact/fiscal value flows from here. The root `layout.tsx`, `Header`, `Footer`, product page, `ProductCard`, etc. read it — **do not hardcode site name, colors, WhatsApp, currency**.
- `theme.ts` — `generateBrandRamp()` derives the `--brand-*` ramp from `SiteSettings.brandColor`; `layout.tsx` injects it as a `<style>` in `<head>` (per-instance theme, no FOUC).
- `validations.ts` — Zod schemas for all admin/API input (incl. `siteSettingsSchema`). `constants.ts` — only session constants now; `utils.ts` — slugify, `formatPrice(amount, currency?, locale?)`, site URL.

**Routing & auth gating:**
- `src/app/(catalog)/…` — public pages (home, `/categoria/[slug]`, `/producto/[categorySlug]/[productSlug]`, `/buscar`, `/privacidad`, plus `robots.ts` / `sitemap.ts`).
- `src/app/admin/(protected)/…` — gated pages. Auth is enforced **twice**: edge `src/middleware.ts` (matcher `/admin/:path*`, verifies the JWT and redirects to `/admin/login`) **and** `requireAdmin()` inside pages/actions. `publicAdminPaths` (login, password reset) bypass the middleware.

**Mutations:**
- Product/category writes = **Server Actions** in `src/app/admin/actions.ts` (`"use server"`), each starting with `await requireAdmin()`.
- Image upload = API route `src/app/api/admin/upload/route.ts` (multipart, calls `processProductImage`).
- Auth login/logout/password-reset = API routes under `src/app/api/auth/`.
- After any write, `revalidatePath(...)` refreshes the affected catalog pages.

## Business rules baked into the code

- Prices use a **single `price` field** (plus optional `priceRollo`/`priceMetro`/`unitRollo`). Tax handling is **per-instance**: `SiteSettings.priceLabel` / `.priceNote` and `.currency` drive the displayed label and formatting (no hardcoded "IGV" or `PEN`).
- Out-of-stock products stay visible with a "Sin stock" badge and a different WhatsApp message (availability inquiry vs. quote).
- **Categories are per-instance and DB-driven** — created from the admin panel, not seeded. Nav (`Header`→`MobileMenu`, home `CategoryCarousel`) reads them via `getRootCategories()` (empty categories hidden). There is no hardcoded category list.

## Environment

`web/.env` is git-ignored; `web/.env.example` is the tracked template (kept via a `!.env.example` exception in `web/.gitignore`). Key vars: `DATABASE_URL` + `DIRECT_URL` (Supabase), `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` / `SUPABASE_STORAGE_BUCKET`, `AUTH_SECRET` (**≥32 chars or auth throws**), `ADMIN_EMAIL` / `ADMIN_PASSWORD` (seed), `NEXT_PUBLIC_SITE_URL`. **`WHATSAPP_NUMBER` is no longer an env var** — it moved to `SiteSettings` (edited in the panel).

## Deployment

**Vercel** (one project per instance, `root = web`), against **Supabase** (Postgres + Storage). Runtime env vars (DB + Supabase + auth) must be set in the Vercel project, not just in local `.env`. Deploys go via the CLI (`vercel deploy --prod`). Heads-up: Supabase free tier pauses after ~7 days idle and the pooler then returns `tenant/user ... not found`, which breaks builds — resume the project in the dashboard.
