# Catálogo White-Label (AI-commerce por WhatsApp)

Plantilla de **catálogo web + panel de administración** cuya conversión final es un mensaje de WhatsApp pre-armado (no checkout en línea). Está pensada para **clonarse y desplegarse por separado para cada empresa/industria**: cada instancia tiene su propia base de datos, storage y dominio, y se personaliza (logo, colores, contacto, categorías) **desde el panel**, sin tocar código.

> No es multi-tenant: una instancia por cliente mantiene cada catálogo liviano (muchas fotos por producto) y aislado. Ver `docs/03-spec-plantilla.md`.

## Estructura

```
├── docs/          # Spec de negocio, plan técnico, spec de plantilla y tareas
└── web/           # Aplicación Next.js (todos los comandos corren aquí)
```

## Inicio rápido (desarrollo)

```bash
cd web
npm install
cp .env.example .env      # completa las variables
npm run db:setup          # migra + seed (admin + configuración neutra, SIN categorías)
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000). Panel: [/admin/login](http://localhost:3000/admin/login) con `ADMIN_EMAIL` / `ADMIN_PASSWORD` del `.env`.

## Levantar una instancia nueva para un cliente

1. Clona/forkea este repo.
2. Crea un proyecto **Supabase** (base de datos + bucket público de Storage).
3. Crea un proyecto **Vercel** apuntando a `web/` y configura las variables de entorno (abajo).
4. `npm run db:setup` — crea el admin y la fila de configuración con valores **neutros**, sin categorías ni productos.
5. Configura el dominio del cliente en Vercel.
6. Entra a **/admin/configuracion** y carga: nombre, logo, color de marca, WhatsApp, contacto, moneda y datos legales.
7. Crea las categorías y productos del cliente desde el panel.
8. Verifica: colores aplicados, WhatsApp correcto, política de privacidad con los datos del cliente.

## Variables de entorno (`web/.env`)

| Variable | Descripción |
|---|---|
| `DATABASE_URL` / `DIRECT_URL` | Supabase Postgres (pooled 6543 / directo 5432) |
| `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` / `SUPABASE_STORAGE_BUCKET` | Storage de imágenes |
| `AUTH_SECRET` | Clave JWT (mín. 32 caracteres) |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Credenciales del admin sembrado |
| `NEXT_PUBLIC_SITE_URL` | URL pública de la instancia |

> El WhatsApp, la marca y el contacto **ya no** son variables de entorno: viven en la configuración editable del panel (`SiteSettings`).

## Scripts útiles

| Comando | Descripción |
|---|---|
| `npm run dev` | Servidor de desarrollo (Turbopack) |
| `npm run build` | Build de producción (`prisma generate` + `next build`) |
| `npm run db:setup` | Migración + seed |
| `npm run db:studio` | Explorar la base de datos |

## Funcionalidades

- Catálogo público por categorías (definidas por cada instancia), búsqueda difusa (pg_trgm), ficha de producto y CTA de WhatsApp pre-armado.
- Panel admin: login, CRUD de productos/categorías, importación masiva, subida de fotos con compresión WebP, contador de vistas.
- **Configuración del sitio** editable: logo, colores (tema dinámico), contacto, redes, moneda/impuestos y texto legal.
- SEO: slugs, meta tags dinámicos, sitemap, robots.txt. Política de privacidad parametrizable por país.

## Documentación

- `docs/00-spec.md` — spec de negocio (v1, instancia base).
- `docs/01-plan-tecnico.md` — arquitectura y stack real.
- `docs/03-spec-plantilla.md` — conversión a plantilla white-label.
- `docs/02-tasks.md` — tareas y estado.
