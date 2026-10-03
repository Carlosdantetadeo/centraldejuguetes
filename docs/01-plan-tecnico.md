# Plan Técnico — Corporación Milán v1

**Versión:** 2.0 | **Actualizado:** Septiembre 2026
**Estado:** 🟢 Alineado con el código en `web/` (reingeniería inversa verificada contra `schema.prisma`, `src/lib/` y las migraciones).

> **Nota de mantenimiento:** este documento describe **cómo está construido el sistema hoy**, no una intención de diseño. Cuando el código y este plan difieran, gana el código y este archivo debe corregirse. La v1.0 de este plan quedó obsoleta (proponía `precioMayorista/precioMinorista` y "precios sin IGV", ninguno de los cuales se implementó).

## Stack real (verificado en `web/package.json`)

| Capa | Tecnología | Versión | Justificación / notas |
|---|---|---|---|
| Framework | **Next.js 16** (App Router) | 16.2.10 | SEO (RNF-6), SSR + ISR, Server Actions. Turbopack. React 19. **Ojo:** versión con breaking changes vs. training data — ver `web/AGENTS.md`. |
| Lenguaje | **TypeScript** | ^5 | Tipado estático |
| Estilos | **Tailwind CSS 4** | 4 | Mobile-first (US-05, US-07), design system custom (`steel-*`) |
| Fuentes | **next/font** (Google) | — | DM Sans (body), Archivo (display), JetBrains Mono (datos) |
| Base de datos | **PostgreSQL (Supabase)** prod / **SQLite** dev | — | Supabase Postgres en prod; SQLite local para preview. Ver "Data layer mid-migration". |
| ORM | **Prisma** | ^5.22 | Modelo tipado, migraciones, seed, `$queryRaw` para pg_trgm |
| Auth | **JWT httpOnly** (`jose`, HS256) + **bcryptjs** | jose ^6.2.3 | Un solo admin (Q-B4), sesión deslizante 30 días (US-06) |
| Imágenes | **sharp** | ^0.35.3 | WebP (3 variantes) + JPEG fallback (US-07b, RNF-2) |
| Storage | **Supabase Storage** | supabase-js ^2.110 | Bucket público, upload REST directa. Ya **no** usa `public/uploads`. |
| Búsqueda | **pg_trgm** (PostgreSQL) | — | `similarity()` fuzzy, índice GIN, tolerante a typos (US-02) |
| Validación | **Zod** | ^4.4.3 | Formularios admin y API |
| Despliegue | **Netlify** (config commiteada) / **Vercel** (en migración) | — | Ver "Despliegue". |

## Data layer — mid-migration (leer antes de tocar DB o imágenes)

- `schema.prisma` puede estar **temporalmente en `provider = "sqlite"`** para preview local contra `prisma/dev.db`. El target de producción es `provider = "postgresql"` con `directUrl` (Supabase: pooled 6543 en runtime, directo 5432 para migraciones). **Verificar el bloque `datasource` antes de migrar.**
- Cambiar de provider exige re-ejecutar `npx prisma generate`. Las migraciones SQLite y Postgres **no** son intercambiables; `prisma/migrations/` se regenera por target.
- Fotos: `src/lib/images.ts` comprime con sharp y sube a Supabase Storage vía `src/lib/supabase.ts` (`getSupabaseAdmin()`, cliente service-role lazy). `ProductImage` guarda URLs públicas completas; `deleteImageFiles` deriva la object key desde la URL.

## Modelo de datos (real — `prisma/schema.prisma`)

- **Admin** — `email` @unique, `passwordHash`, `resetToken?` + `resetTokenExpires?` (recuperación), `lastActiveAt` (sesión deslizante).
- **Category** — `name`, `slug` @unique, `description?`, `sortOrder`, `parentId?` (self-relation `CategoryTree` para subcategorías, `onDelete: SetNull`).
- **Product** — `name`, `slug` (`@@unique([categoryId, slug])`), `description?`, `measure?`, `gauge?`, `material?`, **`price` Float (con IGV)**, **`priceRollo?` / `priceMetro?` / `unitRollo?`** (precio dual rollo/metro), `stock`, `available`, `featured`, `categoryId` (`onDelete: Restrict`). Índices `@@index([name])`, `@@index([featured])`.
  - ⚠️ **No existe columna `vistas`** — la US-14 (contador de vistas) **no está implementada**. Ver spec §6.
- **ProductImage** — `altText` (obligatorio), `sortOrder`, `pathFull` (WebP 1600px), `pathMedium` (WebP 900px), `pathThumb` (WebP 400px), `pathJpegFull` (JPEG 1600px). `onDelete: Cascade`.

### Migraciones aplicadas
`init` → `add_pgtrgm` → `product_name_gin_index` → `add_pricing_rollo_metro`.

## Búsqueda (real — `src/lib/catalog.ts::searchProducts`)

- Extensión **pg_trgm** + índice **GIN** sobre `Product.name`.
- `$queryRaw` con `similarity()` sobre `concat_ws(' ', name, description, measure, gauge, material, category.name)`.
- Umbral **0.08**, orden por score desc, límite **50**. `normalizeSearch()` normaliza acentos/minúsculas antes de la consulta.

## Procesamiento de imágenes (`src/lib/images.ts`)

1. Metadata sharp (rotación EXIF). 2. Resize proporcional: Full 1600px / Medium 900px / Thumb 400px. 3. WebP iterativo (quality 82→40, pasos de 8) hasta target 200/100/40 KB. 4. JPEG fallback 1600px q82 (mozjpeg). 5. Upload Supabase vía REST (`Uint8Array` para evitar bug UTF-8 del SDK). 6. Guarda 4 URLs en `ProductImage`.

## Rutas

### Público — `src/app/(catalog)/`
- `/` — Home tipo storefront (`getStorefrontProducts`: prioriza con-foto → disponible → destacado → nombre) + filtro lateral. Categorías vacías ocultas del grid (`products: { some: {} }`).
- `/categoria/[slug]` — Listado por categoría (incluye subcategorías)
- `/producto/[categorySlug]/[productSlug]` — Ficha
- `/buscar?q=` — Búsqueda pg_trgm
- `/privacidad` — Ley 29733
- `/sitemap.xml`, `/robots.txt` — generados desde BD

### Admin — `src/app/admin/`
- `/admin/login`, `/admin/olvidar-contrasena`, `/admin/restablecer-contrasena`
- `/admin` — Dashboard (stats)
- `/admin/productos`, `/admin/productos/nuevo`, `/admin/productos/[id]/editar`
- `/admin/categorias`

## Autenticación y gating

Auth se aplica **dos veces**: edge `src/middleware.ts` (matcher `/admin/:path*`, verifica JWT, redirige a `/admin/login`; `publicAdminPaths` bypasean) **y** `requireAdmin()` dentro de cada página/acción. JWT HS256 vía `jose` con `AUTH_SECRET` (≥32 chars o auth lanza). Cookie httpOnly `cm_session`, secure en prod, sameSite lax, 30 días deslizantes (`Admin.lastActiveAt`). Recuperación por token UUID en `resetToken`, expira 1h. bcrypt cost 12.

## Mutaciones

- **Server Actions** (`src/app/admin/actions.ts`, `"use server"`, cada una arranca con `await requireAdmin()`): `saveProductAction`, `deleteProductAction`, `saveCategoryAction`, `deleteCategoryAction`. Tras cada escritura, `revalidatePath(...)`.
- **Upload imágenes**: API route `src/app/api/admin/upload/route.ts` (multipart → `processProductImage`).
- **Importación masiva**: `src/components/admin/BulkImport.tsx` — feature nueva (carga múltiple de productos). *No estaba en el spec original; ver US-15 propuesta en spec §6.*
- **Auth**: API routes `src/app/api/auth/` (login, logout, forgot/reset password).

## WhatsApp (`src/lib/whatsapp.ts`)

`buildWhatsAppUrl()` arma `https://wa.me/{WHATSAPP_NUMBER}?text=...`. Producto disponible → mensaje "quiero cotizar" con nombre, medida/calibre, precio referencial (incluye IGV) y URL de ficha + campos vacíos cantidad/RUC. Producto agotado → mensaje "consultar disponibilidad" sin precio.

## Variables de entorno

`DATABASE_URL` + `DIRECT_URL` (Supabase pooled/directo), `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` / `SUPABASE_STORAGE_BUCKET`, `AUTH_SECRET` (≥32 chars), `ADMIN_EMAIL` / `ADMIN_PASSWORD` (seed), `WHATSAPP_NUMBER`, `NEXT_PUBLIC_SITE_URL`. Plantilla en `web/.env.example`.

## Despliegue

**Target: Vercel** (decidido — Q-O6 cerrada). Producción en `corporacion-milan.vercel.app`, contra **Supabase Postgres** (pooler) y **Supabase Storage**. El `netlify.toml` se eliminó (era residual); no quedan dependencias de Netlify. Las env vars de runtime (DB + Supabase + auth) se configuran en el proyecto de Vercel, no solo en `.env` local. La integración Git no dispara deploys automáticos en esta cuenta; se despliega por CLI (`vercel deploy --prod`).

> **Incidencia resuelta:** un build de Vercel falló con `FATAL: (ENOTFOUND) tenant/user postgres.ckrnygpkocklovbyisat not found` al prerenderizar `/sitemap.xml`. Causa: **Supabase free tier se pausa tras ~7 días inactivo** y el pooler deja de resolver el tenant. Fix: reactivar el proyecto en el dashboard y esperar ~1-2 min. Riesgo R-1 de la spec — evaluar keep-alive o plan pago para evitar recurrencia.

## Deuda / brechas vs. spec

1. **US-14 (contador de vistas): no implementada.** Falta columna `vistas` y el "Top 10 más consultados" en admin.
2. **Docs `00b-competitive.md` y `00c-content-inventory.md`: no creados** (referenciados por el spec §11).
3. **Target de despliegue sin consolidar** (Netlify config vs. Vercel activo).
4. **Importación masiva** existe en código pero no estaba especificada.
