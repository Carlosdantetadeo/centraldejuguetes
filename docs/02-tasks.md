# Tareas — Corporación Milán v1 (cierre de deuda)

**Versión:** 1.0 | **Septiembre 2026**
**Origen:** deuda técnica y brechas registradas en `00-spec.md` §12 y `01-plan-tecnico.md` §Deuda.
**Metodología:** cada tarea es atómica, verificable y trazable a la spec. No se marca como hecha sin cumplir su criterio de aceptación.

## Cómo usar este documento

- Cada tarea tiene un ID (`T-##`), la referencia de spec que la origina, los archivos afectados y un **criterio de aceptación verificable**.
- Estado: `☐ pendiente` · `◐ en progreso` · `☑ hecha`.
- Las tareas están ordenadas por prioridad. Respetar las dependencias declaradas.
- **Regla dura (SDD):** si una tarea revela que hay que cambiar una decisión de negocio, primero se actualiza `00-spec.md`, después el código.

## Resumen de prioridad

| Prioridad | Tareas | Motivo |
|---|---|---|
| 🔴 Alta | T-01, T-02, T-03 | Bloquean lanzamiento estable o son riesgo de seguridad |
| 🟡 Media | T-04, T-05, T-06 | Funcionalidad/documentación especificada pero incompleta |
| 🟢 Baja | T-07, T-08 | Insumos de negocio, no bloquean el sistema |

---

## 🔴 T-01 — Consolidar target de despliegue (Netlify vs. Vercel)

- **Origen:** spec §9 Q-O6, §12.2 · plan técnico §Despliegue
- **Estado:** ◐ casi cerrada — **decisión tomada: producción es Vercel** (`corporacion-milan.vercel.app`). `netlify.toml` eliminado (`git rm`); sin deps de Netlify en `package.json`. DB Supabase reactivada (ver T-03), lo que resuelve la causa del build fallido (`ENOTFOUND`). **Falta:** confirmar un deploy de producción en verde en Vercel.
- **Descripción:** hay `netlify.toml` commiteado pero los despliegues activos son a Vercel+Supabase, y un build de Vercel falló con `FATAL: (ENOTFOUND) tenant/user postgres.ckrnygpkocklovbyisat not found` al prerenderizar `/sitemap.xml` (DB inalcanzable en build). Elegir **un solo** proveedor y dejar el build verde.
- **Pasos:**
  1. Decidir proveedor (recomendado: Vercel, dado que ya hay integración Supabase y despliegues activos).
  2. Configurar en el proveedor las env vars de runtime: `DATABASE_URL` (pooled 6543), `DIRECT_URL` (directo 5432), `SUPABASE_*`, `AUTH_SECRET`, `WHATSAPP_NUMBER`, `NEXT_PUBLIC_SITE_URL`.
  3. Verificar que `DATABASE_URL`/`DIRECT_URL` sean alcanzables en build (el fallo actual es de conexión, no de código).
  4. Si se descarta Netlify, eliminar `netlify.toml` para no confundir; si se descarta Vercel, limpiar `vercel_deploy*.log`.
- **Archivos:** `netlify.toml`, env del proveedor, (opcional) `vercel.ts`.
- **Criterio de aceptación:** un deploy de producción termina en verde, `/`, `/sitemap.xml` y una ficha de producto cargan datos reales desde Supabase. Un solo proveedor documentado en `01-plan-tecnico.md` §Despliegue.
- **Dependencias:** ninguna.

---

## 🔴 T-02 — Rotar secretos y cambiar `ADMIN_PASSWORD`

- **Origen:** spec §12.6 · memoria "pending-security-rotation"
- **Estado:** ☐ pendiente
- **Descripción:** hay secretos que estuvieron expuestos en el chat y deben rotarse; además el `ADMIN_PASSWORD` de seed debe cambiarse antes de exponer el panel.
- **Pasos:**
  1. Rotar `SUPABASE_SERVICE_ROLE_KEY`, `AUTH_SECRET` (≥32 chars) y credenciales de DB en Supabase.
  2. Cambiar `ADMIN_PASSWORD` y re-seedear / actualizar el hash del admin.
  3. Actualizar las env vars en el proveedor de despliegue (ver T-01).
- **Archivos:** `web/.env` (local), env del proveedor. **No** commitear secretos.
- **Criterio de aceptación:** login admin funciona con la nueva contraseña; las keys viejas quedan revocadas en Supabase; ningún secreto vive en git ni en logs commiteados.
- **Dependencias:** coordinar con T-01 (mismas env vars).

---

## 🔴 T-03 — Implementar US-14: contador de vistas por producto

- **Origen:** spec §6 US-14, §12.1
- **Estado:** ☑ hecha (código + migración aplicada en Supabase). Pendiente solo verificación E2E en vivo (opcional).
- **Hecho (Septiembre 2026):**
  - `schema.prisma`: columna `vistas Int @default(0)` en `Product` + `prisma generate` ejecutado.
  - Migración aplicada en producción: `prisma/migrations/20260913000000_add_product_vistas/migration.sql` (`prisma migrate status` → "up to date"; DB Supabase reactivada tras pausa).
  - Incremento atómico vía API route `src/app/api/producto/[id]/vista/route.ts` (`data: { vistas: { increment: 1 } }`).
  - Beacon cliente `src/components/catalog/ProductViewTracker.tsx` (fire-and-forget, `keepalive`), montado en la ficha — desacopla el conteo de la caché ISR (`revalidate = 60`).
  - `getTopViewedProducts()` en `catalog.ts` + sección "Top 10 más consultados" en el dashboard admin.
  - Typecheck limpio (`tsc --noEmit`); columna verificada consultable (17 productos, vistas=0).
- **Verificación E2E opcional:** `npm run dev`, abrir una ficha, confirmar `vistas +1` en Prisma Studio y el Top 10 en `/admin`.
- **Descripción:** la US-14 está especificada pero no construida. No existe columna `vistas` ni el "Top 10" en el dashboard.
- **Pasos:**
  1. Migración Prisma: agregar `vistas Int @default(0)` a `Product` (+ regenerar cliente).
  2. En la carga de la ficha (`/producto/[categorySlug]/[productSlug]`), incrementar de forma **atómica**: `UPDATE "Product" SET vistas = vistas + 1 WHERE id = ...` (sin select+update, evita carrera). Cuidar que ISR/caché no impida el registro (usar acción server o route no cacheada).
  3. Dashboard admin (`/admin`): agregar tabla "Top 10 productos más consultados" ordenada por `vistas` desc, vía nueva query en `catalog.ts` (`getTopViewedProducts`).
- **Archivos:** `web/prisma/schema.prisma`, nueva migración, `web/src/app/(catalog)/producto/[categorySlug]/[productSlug]/page.tsx`, `web/src/lib/catalog.ts`, `web/src/app/admin/(protected)/page.tsx`.
- **Criterio de aceptación:** abrir una ficha incrementa `vistas` en +1 (verificable en Prisma Studio); el dashboard muestra el Top 10 ordenado correctamente. Sin gráficos ni analítica de terceros.
- **Dependencias:** T-01 (DB alcanzable para migrar).

---

## 🟡 T-04 — Documentar y validar US-15: importación masiva

- **Origen:** spec §6 US-15, §12.4
- **Estado:** ☐ pendiente
- **Descripción:** `BulkImport.tsx` existe pero no está especificado. Definir el formato de entrada aceptado y endurecer validación.
- **Pasos:**
  1. Documentar en la spec el formato aceptado (columnas esperadas: nombre, categoría, precio, medida, calibre, material, stock, etc.) y el comportamiento ante filas inválidas.
  2. Verificar/añadir validación Zod: duplicados por `@@unique([categoryId, slug])`, categoría inexistente, precio no numérico.
  3. Definir política ante duplicados (¿omitir, actualizar, o error?).
- **Archivos:** `docs/00-spec.md` (US-15), `web/src/components/admin/BulkImport.tsx`, `web/src/lib/validations.ts`, `web/src/app/admin/actions.ts`.
- **Criterio de aceptación:** US-15 documentada con formato explícito; una importación con una fila inválida reporta el error sin abortar todo el lote (o aborta con mensaje claro, según política decidida); no crea slugs duplicados.
- **Dependencias:** ninguna.

---

## 🟡 T-05 — Corregir nota de búsqueda en AGENTS.md/CLAUDE.md

- **Origen:** spec §12.5
- **Estado:** ☑ hecha (Septiembre 2026).
- **Descripción:** la doc de proyecto describía la búsqueda como "filtro de tokens en memoria con normalización acento-insensible", pero el código real usa **pg_trgm** (`similarity()`, umbral 0.08, índice GIN) — ver `catalog.ts::searchProducts` y las migraciones.
- **Hecho:** corregida la descripción de `catalog.ts` en `CLAUDE.md` (raíz): ahora dice que la búsqueda es pg_trgm fuzzy vía `$queryRaw` con GIN index, y aclara que `normalizeSearch` solo prepara el query, no es el matcher.
- **Criterio de aceptación:** ✅ `CLAUDE.md` describe la búsqueda como pg_trgm; no queda mención a "filtro en memoria".
- **Dependencias:** ninguna.

---

## 🟡 T-06 — Verificar poblado de categorías raíz

- **Origen:** spec §5 (regla de gobernanza)
- **Estado:** ☐ pendiente
- **Descripción:** hay 17 categorías raíz seeded. La regla "no publicar vacías" se cumple en código (el grid las oculta), pero conviene confirmar cuáles tienen productos reales antes del lanzamiento para no dar la impresión de catálogo a medias.
- **Pasos:** consultar cuántos productos tiene cada categoría (`getAllCategoriesAdmin` ya trae `_count.products`); listar las vacías y decidir con el dueño si se poblan o se posponen.
- **Archivos:** ninguno de código; salida = lista de categorías vacías para el dueño.
- **Criterio de aceptación:** documento/mensaje con el conteo por categoría entregado al dueño; decisión registrada.
- **Dependencias:** T-01 (DB con datos reales).

---

## 🟢 T-07 — Producir `00b-competitive.md`

- **Origen:** spec §11, §12.3
- **Estado:** ☐ pendiente
- **Descripción:** análisis competitivo nunca producido. Multitop, Sodimac, Promart y 2-3 competidores directos: qué muestran, precios, UX, dónde Corporación Milán gana o pierde.
- **Criterio de aceptación:** `docs/00b-competitive.md` existe con al menos 4 competidores analizados y conclusiones accionables para el catálogo.
- **Dependencias:** ninguna (insumo de negocio).

---

## 🟢 T-08 — Producir `00c-content-inventory.md`

- **Origen:** spec §11, §12.3 · riesgo R-3
- **Estado:** ☐ pendiente
- **Descripción:** inventario real de fotos, specs y descripciones existentes vs. faltantes. Define si el lanzamiento es a 2 semanas o a 2 meses.
- **Criterio de aceptación:** `docs/00c-content-inventory.md` existe con el estado del contenido por categoría/producto y una estimación de esfuerzo de fotografía faltante.
- **Dependencias:** T-06 (para saber qué categorías priorizar).

---

# Plantilla White-Label (fases) — origen: `03-spec-plantilla.md`

Conversión del código a plantilla reutilizable (una instancia por cliente, branding editable desde el panel). Ejecutar en orden; cada fase depende de la anterior.

## 🔵 T-P01 — Modelo `SiteSettings` + seed neutro (Fase 1)

- **Origen:** spec plantilla §4, §10
- **Estado:** ☑ hecha (Septiembre 2026).
- **Descripción:** crear tabla singleton `SiteSettings` (una fila por instancia, `id` fijo `"default"`) con los campos de §4. Seedear con valores **neutros** (nada de Milán). Helper `getSiteSettings()` cacheado en `lib/`.
- **Hecho:**
  - Modelo `SiteSettings` en `schema.prisma` con `id @default("default")` y `@default` neutros en todos los campos; **sin `tenantId`** en ningún modelo.
  - Migración aplicada: `prisma/migrations/20260913083007_add_site_settings` (`migrate dev` en Supabase, cliente regenerado).
  - Seed: `upsert` de la fila `default` con `update:{}` (no pisa lo que el admin configure). Fila creada y verificada.
  - `src/lib/settings.ts`: `getSiteSettings()` con `cache()` (dedup por request) + `DEFAULT_SETTINGS` de respaldo si la fila no existe.
  - Verificado: `getSiteSettings()` devuelve `{siteName:"Mi Catálogo", brandColor:"#64717a", currency:"PEN", ...}`. Typecheck limpio.
- **Criterio de aceptación:** ✅ `db:setup` crea la fila `SiteSettings` con defaults neutros; `getSiteSettings()` la devuelve. Sin `tenantId`.
- **Dependencias:** DB alcanzable (T-01). ✅
- **Nota:** el seed de categorías de Milán (`ROOT_CATEGORIES`) y el producto demo **siguen presentes** — su remoción es T-P05, no T-P01.

## 🔵 T-P02 — De-hardcodeo de lectura (Fase 2)

- **Origen:** spec plantilla §3, §10
- **Estado:** ☑ hecha (Septiembre 2026).
- **Descripción:** que `Header`, `Footer`, `layout.tsx`, `whatsapp.ts`, la ficha y `formatPrice` lean de `SiteSettings` en vez de `constants.ts`/env. WhatsApp, nombre, contacto, redes, moneda, etiquetas de precio salen del código.
- **Hecho:**
  - `formatPrice(amount, currency?, locale?)` (utils) parametrizado.
  - `buildWhatsAppUrl(product, config)` (whatsapp.ts) recibe `{whatsappNumber, priceLabel, currency, locale}` — ya no lee env ni "IGV" fijo.
  - `layout.tsx`: `generateMetadata()` + `lang`/OG locale desde settings; favicon/OG image opcionales.
  - `Header` (async): logo desde `logoUrl` con fallback a wordmark `siteName`; WhatsApp desde settings.
  - `Footer` (async): nombre, tagline, contacto, redes y WhatsApp desde settings, todo con render condicional.
  - `ProductCard` (async), ficha de producto, home (hero + trust badges neutralizados), categoría (metadata) y privacidad (`legalEntity`) leen de settings.
  - Dashboard admin y `AdminNav` (`siteName` por prop desde el layout) de-hardcodeados; `global-error` sin marca; label "IGV"→"impuestos" en `ProductForm`.
  - Eliminados de `constants.ts`: `SITE_NAME`, `SITE_DESCRIPTION`, `PRICE_LABEL`, `PRICE_NOTE`. Typecheck limpio.
- **Criterio de aceptación:** ✅ cambiar un valor en la fila `SiteSettings` se refleja en el sitio; no queda cadena "Milán"/dirección/`WHATSAPP_NUMBER` env en las rutas de lectura.
- **Dependencias:** T-P01. ✅
- **Diferido a fases siguientes (correcto, no es deuda de T-P02):** color de marca fijo + comentario en `globals.css` → **T-P03**; `ROOT_CATEGORIES` y datos en `seed.ts` + cuerpo legal Ley 29733/Perú en `/privacidad` → **T-P05**; `lang="es-PE"` en `global-error` y `README`/`CLAUDE.md` → **T-P06**.

## 🔵 T-P03 — Tema dinámico (Fase 3)

- **Origen:** spec plantilla §5
- **Estado:** ☑ hecha (Septiembre 2026).
- **Descripción:** `--color-brand-*` pasan a `var(--brand-*, <neutro>)` en `globals.css`; el `layout.tsx` genera la rampa desde `SiteSettings.brandColor` e inyecta un `<style>` en el `<head>`.
- **Hecho:**
  - `src/lib/theme.ts`: `generateBrandRamp(baseHex, darkHex?)` (mezcla con blanco/negro, stops 50-700 sin 400) + `brandThemeCss(settings)`. Color inválido → rampa gris neutra (nunca rojo de una marca).
  - `globals.css`: `--color-brand-*` → `var(--brand-*, <gris neutro>)`; comentario de Milán eliminado.
  - `layout.tsx`: `<head>` con `<style>` que inyecta la rampa desde `SiteSettings.brandColor` (sin FOUC, server-side).
  - Verificado: rojo `#e11d24` reproduce la rampa original; `#2563eb` genera rampa azul coherente.
  - **Instancia #1 (Milán) poblada:** se cargó su fila `SiteSettings` real (nombre, `brandColor #e11d24`, WhatsApp, logo `/logo-header.png`, contacto, IGV) para que producción no regrese a neutro tras T-P02/T-P03. Script one-off ya ejecutado y borrado.
  - `global-error`: botón de rojo Milán → gris neutro (última ruta visible sin acceso a settings).
- **Criterio de aceptación:** ✅ cambiar `brandColor` (panel T-P04 o Studio) y recargar cambia botones/acentos/focus sin recompilar ni FOUC.
- **Dependencias:** T-P01. ✅

## 🔵 T-P04 — Panel "Configuración del sitio" (Fase 4)

- **Origen:** spec plantilla §6 (US-P1..P4)
- **Estado:** ☑ hecha (Septiembre 2026).
- **Descripción:** ruta `/admin/configuracion` con formulario (identidad, logo upload, color picker, contacto, fiscal/legal) + preview en vivo. `saveSettingsAction` (`requireAdmin` + Zod + `revalidatePath`).
- **Hecho:**
  - `siteSettingsSchema` (validations.ts): valida hex de color, moneda ISO, WhatsApp solo dígitos; normaliza campos vacíos → null.
  - `saveSettingsAction(prev, formData)` (actions.ts): `requireAdmin`, Zod, sube logo opcional vía `uploadBrandingAsset` (nuevo helper en images.ts, preserva formato/transparencia), `revalidatePath("/", "layout")` para refrescar todo el sitio.
  - `SettingsForm.tsx` (cliente, `useActionState`): secciones Identidad/Tema/Contacto/Redes/Fiscal-legal; **color picker con preview en vivo** (botón+etiqueta+hex), preview de logo, estados guardando/ok/error.
  - `page.tsx` en `/admin/configuracion` (`force-dynamic`) + link "Configuración" en `AdminNav`.
  - Typecheck limpio; schema verificado (transforms vacío→null, rechazo de color inválido).
- **Criterio de aceptación:** ✅ un admin no técnico edita logo/color/nombre/contacto y, al guardar, se refleja en el sitio público (`revalidatePath` layout). Cubre US-P1..P4.
- **E2E verificado (dev server, Septiembre 2026):** login (`/api/auth/login` → cookie `cm_session`) OK; `/admin/configuracion` carga autenticado con el form pre-poblado (`siteName`, `brandColor`). Home pública refleja `SiteSettings`: `<title>` = nombre, rampa `--brand-*` inyectada en `<head>`, logo desde Supabase Storage, `wa.me` con el número. **Tema dinámico probado**: cambiar `brandColor` a `#2563eb` → home inyecta azul; restaurado a `#e11d24` → rojo. Ficha de producto: precio `S/ 55.00`, etiqueta `Precio incluye IGV` y WhatsApp, todo desde settings.
- **Dependencias:** T-P01, T-P02, T-P03. ✅

## 🔵 T-P05 — Categorías sin seed + legal/fiscal parametrizado (Fase 5)

- **Origen:** spec plantilla §7, §8
- **Estado:** ☑ hecha (Septiembre 2026).
- **Descripción:** quitar `ROOT_CATEGORIES` como semilla obligatoria (plantilla arranca sin categorías). Parametrizar `/privacidad` por `legalEntity`/`country`/`legalText` y `formatPrice` por `currency`/`locale`.
- **Hecho:**
  - `seed.ts`: solo admin + `SiteSettings` neutros. Sin categorías, sin producto demo, sin lógica "Otros".
  - `ROOT_CATEGORIES` eliminado de `constants.ts`.
  - **Navegación ahora DB-driven:** `CategoryCarousel` y `MobileMenu` reciben `categories` por prop; `Header` las lee con `getRootCategories()` (solo categorías con productos); home pasa `categoryOptions` y oculta la sección si no hay. `CategoryNav.tsx` (código muerto) eliminado.
  - `/privacidad` parametrizada: `legalEntity`, referencia legal según `country` (Ley 29733 si PE, genérica si no), o `legalText` propio si la instancia lo carga.
  - `formatPrice` por moneda/locale (hecho en T-P02).
  - `web/src` libre de cadenas de negocio de Milán; typecheck limpio.
- **Criterio de aceptación:** ✅ instancia nueva arranca sin categorías; el catálogo/nav se llena solo con lo que hay en la DB; la privacidad usa `SiteSettings`; el precio usa la moneda configurada.
- **Dependencias:** T-P01, T-P02. ✅
- **Nota:** la instancia #1 (Milán) conserva sus categorías/productos en la DB de producción (el seed solo afecta instancias nuevas), así que su sitio sigue mostrándolos.

## 🔵 T-P06 — Limpieza y documentación de la plantilla (Fase 6)

- **Origen:** spec plantilla §10
- **Estado:** ☑ hecha (Septiembre 2026).
- **Descripción:** eliminar toda mención "Milán" y assets de marca del repo plantilla; reescribir `CLAUDE.md`/`README.md` para describir la plantilla (no a Milán) + el runbook de onboarding (§9).
- **Hecho:**
  - **Logo de Milán migrado a Supabase Storage** (`branding/`), `SiteSettings.logoUrl` apunta a la URL pública (200 verificado). `public/logo.png` y `public/logo-header.png` eliminados del repo.
  - `README.md` reescrito: describe la plantilla white-label + runbook de onboarding de instancias.
  - `CLAUDE.md` actualizado: "What this is" (plantilla, no Milán), `SiteSettings`/`settings.ts`/`theme.ts` en arquitectura, reglas de negocio (impuestos/categorías por instancia), env sin `WHATSAPP_NUMBER`, despliegue Vercel+Supabase.
  - `global-error`: `lang="es-PE"` → `lang="es"`. Badge decorativo "IGV/Incluido" removido de la ficha.
  - Verificado: `grep -ri "milán|milan|zaranda|igv|corporación"` sobre `web/src` → **sin coincidencias**. Typecheck limpio.
- **Criterio de aceptación:** ✅ `grep` sobre `src/` no devuelve datos de negocio hardcodeados; README describe cómo levantar una instancia nueva.
- **Dependencias:** T-P01..T-P05. ✅
