# SPEC — Plantilla White-Label de Catálogo (AI-commerce)

**Versión:** 1.0
**Metodología:** Spec-Driven Development (SDD)
**Estado:** 🟢 Decisiones de arquitectura tomadas. Lista para plan de implementación por fases (§10).
**Última actualización:** Septiembre 2026
**Relación:** extiende el producto descrito en `00-spec.md` (Corporación Milán). Corporación Milán deja de ser "el proyecto" y pasa a ser **la primera instancia** de esta plantilla.

---

## 0. Cambio de visión (leer primero)

El código de `web/` se construyó a medida para **Corporación Milán**, con su marca, colores, categorías y datos de contacto **cocidos en el código**. La nueva visión es:

> Convertir este código en una **plantilla white-label reutilizable**: para cada cliente/industria que vendamos, se **clona la plantilla y se despliega por separado** (DB, Supabase y Vercel propios de esa instancia). Cada instancia se personaliza —logo, colores, nombre, contacto, categorías— **sin editar código**, desde su panel de administración.

**Por qué NO multi-tenant.** Se evaluó y se descartó un modelo multi-tenant (una sola app/DB sirviendo a todas las empresas con `tenantId`). Motivo: cada catálogo tiene **muchas fotos por producto**; concentrar todas las empresas en una sola base y un solo storage se vuelve pesado y caro, y complica backups/rendimiento. **Una instancia por cliente** mantiene cada catálogo liviano y aislado por diseño.

**Qué significa "sacar todo lo que no está en el spec de la herramienta".** Todo lo que es específico de Corporación Milán (marca, colores, categorías fijas, contacto, textos legales de Perú) **sale del código** y se vuelve **configuración editable**. El código queda como una plantilla genérica que no menciona a ninguna empresa en particular.

---

## 1. Modelo del producto

- **Plantilla (este repo):** código genérico, sin datos de ninguna empresa. Fuente de verdad de features y correcciones.
- **Instancia (por cliente):** un despliegue independiente creado clonando la plantilla. Tiene:
  - su propia base de datos (Supabase Postgres),
  - su propio bucket de Storage,
  - su propio proyecto Vercel + dominio,
  - su propia **configuración de sitio** (branding, contacto, fiscal) editable desde el panel.
- **Onboarding (decidido):** clonar el repo + deploy manual por cliente (crear Supabase + Vercel, setear env, configurar branding desde el panel). Suficiente para el volumen inicial; un script de bootstrap queda como mejora futura (§10, fuera de v1).
- **"Superadmin" (aclaración):** en este modelo **no hay** un superadmin central que gestione varias empresas (eso sería multi-tenant). El "superadmin" es el **admin de cada instancia**, que ahora además gestiona la Configuración del Sitio de SU catálogo. No hay panel cruzado entre clientes.

---

## 2. Alcance

### Dentro del alcance (v1 de la plantilla)

- **Modelo de configuración `SiteSettings`** (singleton por instancia) en la DB (§4).
- **Sección "Configuración del sitio"** en el panel admin para editar branding, contacto y datos fiscales/legales (§6).
- **Tema dinámico**: los colores de marca dejan de ser estáticos y se inyectan por instancia desde `SiteSettings` (§5).
- **De-hardcodeo**: extraer todo lo específico de Milán del código a `SiteSettings` (§3).
- **Categorías sin seed fijo**: cada instancia arranca sin categorías predefinidas; el admin crea las suyas (§7).
- **Datos fiscales/legales configurables**: moneda, impuesto, etiquetas de precio, país/idioma, texto legal (§8).
- **Runbook de onboarding** para levantar una instancia nueva (§9).

### Fuera de alcance (v1 de la plantilla)

- Multi-tenancy (una app para varias empresas) — descartado por diseño.
- Panel "superadmin" central cruzando instancias.
- Facturación/suscripciones de los clientes del SaaS.
- Script automatizado de bootstrap de instancias (mejora futura).
- Editor visual de temas tipo "theme builder" avanzado (basta con paleta configurable).
- i18n completo (multi-idioma en la misma instancia). Cada instancia es monolingüe, configurable por país.

---

## 3. Inventario de extracción (de-hardcodeo)

Todo esto **sale del código** y pasa a `SiteSettings` (o a creación por el admin). Referencias verificadas contra el código actual.

| # | Elemento | Dónde está hoy | Destino |
|---|---|---|---|
| 1 | Nombre y descripción del sitio | `SITE_NAME`, `SITE_DESCRIPTION` (`src/lib/constants.ts`) | `SiteSettings.siteName`, `.siteDescription` |
| 2 | Logo (header) | `/logo-header.png` estático + `<img>` en `Header.tsx` | `SiteSettings.logoUrl` (subido a Storage) |
| 3 | Favicon / OG default | assets estáticos, metadata en `layout.tsx` | `SiteSettings.faviconUrl`, `.ogImageUrl` |
| 4 | Colores de marca | `--color-brand-*` fijos en `globals.css` (`@theme`) | `SiteSettings.brandColor*` → CSS vars runtime (§5) |
| 5 | Categorías raíz | `ROOT_CATEGORIES` (17) en `constants.ts`, usadas por el seed | Sin seed fijo; creadas por el admin (§7) |
| 6 | Número WhatsApp | `WHATSAPP_NUMBER` (env global) usado en Header/Footer/whatsapp.ts | `SiteSettings.whatsappNumber` |
| 7 | Dirección + Google Maps | consts en `Footer.tsx` | `SiteSettings.address` |
| 8 | Teléfono mostrado | `phoneDisplay` en `Footer.tsx` | `SiteSettings.phone` |
| 9 | Redes sociales | `SOCIALS` (hrefs "#") en `Footer.tsx` | `SiteSettings.social*` |
| 10 | Copy del footer / rubro | texto "zarandas, mallas..." en `Footer.tsx` | `SiteSettings.footerTagline` |
| 11 | Etiqueta de precio / IGV | `PRICE_LABEL`, `PRICE_NOTE` (`constants.ts`) | `SiteSettings.priceLabel`, `.priceNote` |
| 12 | Moneda / formato | `formatPrice` fija PEN (`utils.ts`) | `SiteSettings.currency` (ISO 4217) |
| 13 | País / idioma / locale | `lang="es-PE"`, `locale: "es_PE"` (`layout.tsx`) | `SiteSettings.locale`, `.country` |
| 14 | Texto legal / privacidad | `/privacidad` con Ley 29733 (Perú) | Plantilla + `SiteSettings` (país, titular, base legal) |
| 15 | URL del sitio | `NEXT_PUBLIC_SITE_URL` (env) | Se mantiene en env (infra), no en DB |

**Regla:** tras el de-hardcodeo, **ninguna cadena del código** debe decir "Corporación Milán", "Milán", "zarandas...", una dirección o un color de marca concreto. Milán solo existe como **datos** en la DB de su instancia.

---

## 4. Modelo de datos — `SiteSettings`

Tabla **singleton** (una sola fila por instancia). Se lee en el layout y se cachea; se edita desde el panel.

```
SiteSettings
├── id                (singleton, ej. fijo "default")
├── — Identidad —
├── siteName          String
├── siteDescription   String
├── logoUrl           String?      // Supabase Storage
├── faviconUrl        String?
├── ogImageUrl        String?
├── — Tema —
├── brandColor        String       // hex base, ej. "#e11d24"
├── brandColorDark    String?      // hover/acento; derivable si se omite
├── — Contacto —
├── whatsappNumber    String       // con código país, ej. "51959744441"
├── phone             String?
├── address           String?
├── socialFacebook    String?
├── socialInstagram   String?
├── socialTiktok      String?
├── footerTagline     String?
├── — Fiscal / legal —
├── currency          String       // ISO 4217, ej. "PEN"
├── locale            String       // ej. "es-PE"
├── country           String       // ej. "PE"
├── priceLabel        String       // ej. "Precio incluye IGV"
├── priceNote         String       // ej. "Precio referencial..."
├── legalEntity       String?      // titular de datos para la política
├── legalText         String?      // cuerpo de la política (o plantilla)
└── updatedAt         DateTime
```

**Notas de diseño:**
- Singleton: se garantiza por un `id` fijo (`"default"`) y `upsert` en el guardado. No hay `tenantId` — el aislamiento es el despliegue mismo.
- Se **seedea con valores neutros** (nombre "Mi Catálogo", color gris neutro, etc.), no con datos de Milán.
- `brandColorDark` opcional: si falta, se deriva oscureciendo `brandColor` (evita pedir dos colores a un usuario no técnico).
- Los `Admin`, `Category`, `Product`, `ProductImage` **no cambian** (siguen sin `tenantId`).

---

## 5. Tema dinámico (colores por instancia)

**Problema:** hoy los colores viven en `globals.css` dentro de `@theme` (estáticos, compilados). Para que cada instancia tenga su color sin recompilar el CSS por cliente, hay que inyectarlos **en runtime**.

**Enfoque:**
1. En `globals.css`, `--color-brand-*` se definen como referencias a variables CSS con *fallback* (ej. `--color-brand-500: var(--brand-500, #64717a)` con neutro por defecto).
2. En `layout.tsx` (server component), leer `SiteSettings`, generar la rampa de tonos a partir de `brandColor` (50→700) y emitir un `<style>` en el `<head>` que setee las `--brand-*` en `:root`.
3. La paleta `steel-*` (neutros) y `whatsapp` se mantienen fijas (no son marca; el verde WhatsApp es del propio WhatsApp).

**Criterio de aceptación:** cambiar `brandColor` en el panel y recargar refleja el color nuevo en botones, acentos y focus rings, sin tocar código ni recompilar.

---

## 6. Panel admin — "Configuración del sitio"

### US-P1 — Como administrador, quiero editar el nombre, logo y colores de mi catálogo, para que refleje mi marca sin ayuda técnica.
- **Criterio:** nueva ruta `/admin/configuracion`. Formulario con: nombre, descripción, subida de logo (reusa `processProductImage`/upload), color de marca (color picker), y vista previa. Al guardar (`saveSettingsAction` con `requireAdmin` + Zod), `revalidatePath` refresca el sitio público.

### US-P2 — Como administrador, quiero configurar mi WhatsApp, teléfono, dirección y redes, para que mis clientes me contacten.
- **Criterio:** en la misma pantalla, campos de contacto. El número de WhatsApp alimenta Header, Footer y los deep links `wa.me`. La dirección arma el enlace a Google Maps.

### US-P3 — Como administrador, quiero configurar moneda, etiqueta de precio y datos legales, para adaptar el catálogo a mi país.
- **Criterio:** campos de moneda (ISO 4217), etiqueta de precio, nota de precio, país/idioma y datos del titular para la política de privacidad. `formatPrice` usa `currency`/`locale` de `SiteSettings`.

### US-P4 — Como administrador, quiero una vista previa de mi branding antes de publicar, para no equivocarme.
- **Criterio:** la pantalla muestra un mini-preview (card + botón con el color elegido) que refleja los cambios en vivo antes de guardar.

> Los datos de `SiteSettings` se inyectan al catálogo público vía el layout (server), no por env. Header, Footer, `layout.tsx`, `whatsapp.ts`, la ficha y la política de privacidad leen de `SiteSettings` en vez de `constants.ts`/env.

---

## 7. Categorías (sin seed fijo)

- Se elimina el uso de `ROOT_CATEGORIES` como semilla obligatoria. La plantilla arranca **sin categorías**.
- Cada instancia crea sus categorías desde el panel (el CRUD ya existe). La regla de gobernanza (no publicar categorías vacías) se mantiene: el grid ya oculta las vacías.
- `ROOT_CATEGORIES` puede conservarse como **ejemplo comentado** en la doc de onboarding, no como código activo.

---

## 8. Fiscal y legal configurables

- **Moneda/formato:** `formatPrice(amount, settings)` usa `currency` + `locale`. Ya no fija `PEN`/`es-PE`.
- **Impuesto/etiquetas:** `priceLabel` y `priceNote` salen de `SiteSettings`. El mensaje de WhatsApp usa `priceLabel` (ya no dice "incluye IGV" fijo).
- **Privacidad:** `/privacidad` se vuelve una **plantilla** parametrizada por `legalEntity`, `country` y `legalText`. Por defecto, texto neutro genérico; para Perú se completa con Ley 29733. Nota: no es asesoría legal; el cliente valida su texto.

---

## 9. Runbook de onboarding de una instancia nueva

1. Clonar/forkear la plantilla.
2. Crear proyecto Supabase (DB + bucket público de Storage) para el cliente.
3. Crear proyecto Vercel apuntando a `web/`; setear env: `DATABASE_URL`, `DIRECT_URL`, `SUPABASE_*`, `AUTH_SECRET` (≥32), `ADMIN_EMAIL`/`ADMIN_PASSWORD`, `NEXT_PUBLIC_SITE_URL`. (`WHATSAPP_NUMBER` deja de ser env: pasa a `SiteSettings`.)
4. `npm run db:setup` (migra + seed: admin + `SiteSettings` con valores neutros, **sin** categorías).
5. Configurar dominio del cliente en Vercel.
6. Entrar a `/admin/configuracion` y cargar branding + contacto + fiscal.
7. Crear categorías y productos.
8. Verificar: colores aplicados, WhatsApp correcto, política de privacidad con datos del cliente.

---

## 10. Fases de implementación (para `02-tasks.md`)

- **Fase 1 — Configuración base:** modelo `SiteSettings` + migración + seed neutro + `getSiteSettings()` cacheada.
- **Fase 2 — De-hardcodeo lectura:** Header, Footer, `layout.tsx`, `whatsapp.ts`, ficha y `formatPrice` leen de `SiteSettings` en vez de `constants.ts`/env.
- **Fase 3 — Tema dinámico:** inyección de `--brand-*` desde `SiteSettings` en el layout (§5).
- **Fase 4 — Panel de configuración:** ruta `/admin/configuracion`, `saveSettingsAction`, subida de logo, color picker, preview (US-P1..P4).
- **Fase 5 — Categorías + legal:** quitar seed fijo de categorías; parametrizar `/privacidad` y datos fiscales.
- **Fase 6 — Limpieza:** eliminar toda mención "Milán" del código; assets de Milán fuera del repo plantilla; actualizar `CLAUDE.md`/`README` para describir la plantilla, no a Milán.

Estas fases se detallarán como tareas atómicas (`T-P##`) en `02-tasks.md`.

---

## 11. Riesgos y decisiones

- **R-P1 — Duplicación de código entre instancias.** Con "clonar + deploy manual", un fix hay que propagarlo a cada fork. Mitigación: mantener la plantilla como upstream y hacer `merge`/`rebase` desde ella; a futuro, evaluar "un repo, múltiples proyectos Vercel".
- **R-P2 — Flash de tema por inyección runtime.** Inyectar `<style>` en el `<head>` desde el server evita FOUC; validar que no haya parpadeo de color en la primera carga.
- **R-P3 — Config incompleta al lanzar.** Si el admin no llena `SiteSettings`, el sitio muestra valores neutros. Mitigación: checklist de onboarding (§9) + validación de campos mínimos antes de "publicar".
- **R-P4 — Legal genérico.** El texto de privacidad por defecto es neutro y no sustituye asesoría legal por país. El cliente valida.
- **Decisión ✅ tomada:** se aplicó el refactor en este mismo repo y Corporación Milán quedó como **instancia #1** — sus datos (branding, categorías, productos, logo en Storage) viven en su DB de producción; el código quedó genérico. Fases T-P01..T-P06 completadas (ver `02-tasks.md`).
