# SPEC — Corporación Milán | Catálogo Digital + Panel de Gestión

**Versión:** 0.4 (reconciliada con el código implementado)
**Metodología:** Spec-Driven Development (SDD)
**Estado:** 🟢 v1 construido y en producción. Spec alineada con el código real en `web/`. Pendiente: operativas 🟢 (Q-O1 a Q-O6) y deuda listada en §12.
**Última actualización:** Septiembre 2026

## Changelog v0.3 → v0.4 (reconciliación con el código)

Esta versión **no cambia decisiones de negocio**; sincroniza la spec con lo que realmente se construyó. Verificado contra `schema.prisma`, `src/lib/` y las migraciones.

- **Categorías (§5):** la estructura real tiene **17 categorías raíz**, no 4. "Zarandas" **ya no existe** como categoría; el catálogo se amplió a Film, Raschell, Grass, Mallas, Plásticos, Mangueras, Alambre, Piso Vinil, Cintas, Sogas, Cables de Acero, Cartón, Arpilleras, Lona/Tarflex, Alfombras, Micas, Zunchos. La regla de gobernanza (no publicar categoría vacía) **sí está implementada** en código (el grid oculta categorías sin productos).
- **Precios (US-03):** además del `price` único con IGV, el modelo soporta **precio dual rollo/metro** (`priceRollo`, `priceMetro`, `unitRollo`) — no estaba en v0.3.
- **US-14 (contador de vistas): NO implementada.** No existe la columna `vistas`. Se marca como pendiente (§6 y §12).
- **US-15 (nueva):** importación masiva de productos — existe en código (`BulkImport.tsx`), no estaba especificada.
- **Búsqueda:** confirmada como pg_trgm real (§ Plan Técnico), tolerante a typos como exige la US-02.
- **Despliegue:** nueva Q-O6 — target sin consolidar (Netlify commiteado vs. Vercel+Supabase activo).
- **Docs faltantes (§11):** `00b-competitive.md` y `00c-content-inventory.md` nunca se produjeron; se registra como deuda.

## Changelog v0.2 → v0.3

- **Q-B1 resuelta:** categoría "Otros" se elimina. Nueva regla de gobernanza: no se crea categoría nueva sin mínimo 2-3 productos reales para poblarla (ver sección 5).
- **Q-B2 resuelta:** precio siempre visible (no "consultar precio"). Copy fijo: "Precio referencial, cotización final por WhatsApp según volumen". Riesgo de conversión declarado y aceptado por el dueño — monitorear con US-14 (contador de vistas).
- **Q-B3 resuelta:** sin precios diferenciados mayorista/minorista en v1. Confirmado fuera de alcance.
- **Q-B4 resuelta:** un solo rol administrador (el dueño). No hay vendedor con acceso al panel.
- **Q-N1 resuelta:** producto agotado se muestra con badge "Sin stock", no se oculta.
- **Q-N2 resuelta:** se elimina GA4/Plausible del alcance. Se reemplaza por contador de vistas propio (nueva US-14). Esto también simplifica RNF-12 (ya no aplica consentimiento de cookies de analítica).
- **Q-N3 resuelta:** precio se muestra con IGV incluido, con etiqueta fija "Precio incluye IGV" junto al monto.

---

## Cómo leer este documento

Esta spec es la **fuente de verdad** del proyecto. Antes de escribir una sola línea de código, todo lo que el sistema debe hacer tiene que estar descrito acá. El flujo de trabajo es:

```
1. SPEC (este documento)              → qué debe hacer el sistema y por qué
2. ANÁLISIS COMPETITIVO (00b)          → contra qué se compara y por qué gana
3. INVENTARIO DE CONTENIDO (00c)       → qué fotos/datos existen ya, qué falta
4. PLAN TÉCNICO (01)                   → cómo se construye (stack, arquitectura, modelo de datos)
5. TAREAS (02-tasks.md)                → lista ejecutable, atómica, verificable
6. IMPLEMENTACIÓN                       → tarea por tarea contra la spec
7. VALIDACIÓN                           → cada feature contra sus criterios de aceptación
```

**Regla dura:** si algo no está en la spec, no se construye. Si hay que cambiar algo durante la construcción, primero se actualiza la spec y después el código — nunca al revés.

**Esta spec NO define stack técnico** (React, Next.js, Supabase, etc.). Eso pertenece al Plan Técnico (documento 01). La spec define requisitos, el plan decide cómo cumplirlos.

---

## 1. Visión del negocio

**Corporación Milán** vende zarandas, mallas (electrosoldada, olímpica, tejida, plástica) y productos plásticos industriales/agrícolas en Perú. El cliente objetivo son constructoras, ferreterías, agricultores y en menor medida público general.

**Problema actual:** la atención se hace por WhatsApp enviando fotos sueltas — lento, desordenado, poco profesional frente a competidores formales. El vendedor pierde tiempo repitiendo información básica (medidas, calibres, precios) que debería estar disponible autónomamente.

**Objetivo del sistema:** una tienda digital tipo catálogo (sin checkout de pago online en v1) donde el cliente navega productos por categoría, ve precio y specs, y termina la contactando por WhatsApp con el pedido ya armado. Administrado por el dueño del negocio sin conocimientos técnicos.

**Referencia de mercado:** [multitop.pe](https://www.multitop.pe) y otros competidores — el análisis detallado va en `00b-competitive.md` (documento separado). No se avanza a Plan Técnico sin ese documento.

---

## 2. Decisión de arquitectura de contenido: por qué panel admin y no Google Sheets

Se evaluaron dos caminos para la gestión de contenido:

| Criterio | Opción A: Google Sheets como fuente | Opción B: Panel admin con base de datos |
|---|---|---|
| Costo de desarrollo | Bajo (S/500-900) | Medio-alto (S/1.800-3.500) |
| Curva de aprendizaje del dueño | Nula (ya sabe Excel) | Media (formulario web) |
| Subida de fotos desde celular | Manual (subir a Drive, pegar link) | Automatizada (cámara → compresión → upload) |
| Escalabilidad a 300+ SKUs | Se rompe (Sheets se pone lento, difícil relacionar categorías) | Sin límite práctico |
| Compresión automática de imágenes | No disponible | Sí |
| Roles diferenciados (dueño vs vendedor) | No posible | Posible |
| SEO amigable (URLs por producto, meta tags) | Complicado | Nativo |
| Riesgo de que un vendedor borre una columna y rompa todo | Alto | Bajo |

**Decisión:** se opta por **Opción B (panel admin)** para Corporación Milán porque:
- El catálogo objetivo supera los 100 SKUs y crece;
- Se requiere subida de fotos desde celular en obra (US-07), inviable en Sheets;
- El requisito de SEO (RNF-6) descarta Sheets como fuente de verdad;
- El costo adicional se justifica por el tamaño del cliente.

Sheets sigue siendo válido para microempresas de ≤30 productos, pero **no es este caso**.

---

## 3. Alcance de la versión 1 (v1)

### Dentro del alcance

**Catálogo público:**
- Home con listado de categorías y productos destacados
- Navegación por categoría y subcategoría
- Buscador de productos
- Ficha de producto con fotos, medidas/specs, precio (o "consultar" según decisión de negocio), estado (disponible/agotado)
- Botón "Cotizar por WhatsApp" con mensaje pre-armado (vía enlace `wa.me` — ver sección 8)
- URLs amigables por producto y categoría (SEO)
- Meta tags dinámicos por producto (title, description, OpenGraph)
- Sitemap.xml auto-generado
- Analytics básica (GA4 o Plausible — a decidir en plan técnico)
- Política de privacidad y aviso de tratamiento de datos (Ley 29733)

**Panel de administración privado:**
- Login con email y contraseña
- Recuperación de contraseña por email
- Cierre de sesión y expiración de sesión inactiva
- Crear, editar, eliminar productos
- Subir fotos de producto desde celular con compresión automática
- Editar precios y stock
- Organizar categorías y subcategorías (crear, renombrar, reordenar)
- Marcar producto como agotado sin eliminarlo
- Alt text obligatorio en cada imagen (accesibilidad + SEO)

**Capacidad inicial:**
- Hasta 100 productos activos y 300 imágenes en v1, con capacidad de crecer a 500 productos y 1.500 imágenes sin rediseño de arquitectura.

### Fuera de alcance en v1 (posible v2)

- Pasarela de pago online (Culqi, Niubiz, Izipay)
- Carrito multi-producto con checkout
- Facturación electrónica integrada
- Precios diferenciados mayorista vs minorista *(salvo que la Q-B2 de la sección 9 se responda como sí; en ese caso pasa a v1)*
- Multi-usuario con roles distintos *(salvo Q-B4 en sección 9)*
- App móvil nativa
- Blog / contenido de marketing
- Integración con WhatsApp Business API (se usa `wa.me` en v1)
- Integración con ERP / sistema contable del cliente

---

## 4. Roles de usuario

| Rol | Descripción | Acceso |
|---|---|---|
| **Visitante** | Cliente que navega el catálogo público | Sin login, solo lectura |
| **Administrador** | Dueño del negocio o vendedor de confianza | Login requerido, gestiona todo el contenido |

En v1 no se distingue "dueño" de "vendedor" — es un solo rol admin. La separación queda condicionada a la respuesta de Q-B4 (sección 9).

---

## 5. Estructura de categorías (real — `web/src/lib/constants.ts::ROOT_CATEGORIES`)

El catálogo se amplió de las 4 categorías del borrador v0.3 a **17 categorías raíz**. "Zarandas" **ya no existe**. Estas son las categorías raíz seeded actualmente:

| Categoría | slug | Descripción |
|---|---|---|
| Film | `film` | Film estirable y agrícola para embalaje y cobertura |
| Raschell | `raschell` | Mallas raschell para sombra, agricultura y protección |
| Grass | `grass` | Césped sintético y paisajismo |
| Mallas | `mallas` | Electrosoldadas, olímpicas, tejidas y más |
| Plásticos | `plasticos` | Plásticos agrícolas e industriales |
| Mangueras | `mangueras` | Industriales y agrícolas de todo calibre |
| Alambre | `alambre` | Galvanizado, de púas y especiales |
| Piso Vinil | `piso-vinil` | Pisos vinílicos comercial/industrial |
| Cintas | `cintas` | Embalaje, señalización, uso industrial |
| Sogas | `sogas` | Polipropileno, nylon y más |
| Cables de Acero | `cables-de-acero` | Izaje, tensión y amarre |
| Cartón | `carton` | Cajas y láminas corrugadas |
| Arpilleras | `arpilleras` | Costales y sacos de yute/polipropileno |
| Lona / Tarflex | `lona-tarflex` | Lonas y cobertores |
| Alfombras | `alfombras` | Entrada, industriales, decorativas |
| Micas | `micas` | Mica transparente y policarbonato |
| Zunchos | `zunchos` | Flejes plástico y metálico |

Las subcategorías se soportan vía `Category.parentId` (self-relation) pero se crean bajo demanda desde el panel admin, no se seedean.

> ✅ Regla de gobernanza (Q-B1) — **implementada en código**: el grid principal (`getRootCategories`, `getStorefrontProducts`) oculta categorías sin productos (`products: { some: {} }`). Una categoría raíz seeded pero vacía **no aparece** en el catálogo público. Esto cumple la regla sin borrar la categoría de la BD.

**Regla de gobernanza de categorías (obligatoria):** no se publica una categoría nueva sin mínimo 2-3 productos reales para poblarla. En v1 esto se cumple automáticamente ocultando las vacías. Esta regla también vive en el skill `whatsapp-catalog-design` (Regla 0).

---

## 6. Historias de usuario (User Stories)

Formato: `Como [rol], quiero [acción], para [beneficio]`

### Catálogo público

**US-01** — Como visitante, quiero ver productos organizados por categoría, para encontrar rápido lo que necesito.
- **Criterio de aceptación:** desde la home hago clic en una categoría (ej. "Mallas") y veo solo los productos de esa categoría y subcategorías.

**US-02** — Como visitante, quiero buscar un producto por nombre o medida, para no navegar categorías si ya sé lo que busco.
- **Criterio de aceptación:** escribo "malla olímpica 2m" y aparecen resultados en menos de 1 segundo (percibido) incluso en conexión móvil lenta. La búsqueda tolera acentos y errores menores de tipeo.

**US-03** — Como visitante, quiero ver fotos, medidas y precio antes de contactar, para no perder tiempo preguntando información básica por WhatsApp.
- **Criterio de aceptación (actualizado v0.3 — Q-B2, Q-N3 resueltas):** la ficha muestra mínimo 1 foto, precio con IGV incluido, etiqueta fija "Precio incluye IGV" junto al monto, nota "Precio referencial, cotización final por WhatsApp según volumen" visible junto al precio (no como texto perdido), y specs técnicas (medida, calibre, material). No hay modo "consultar precio" — el precio siempre se muestra.
- **Adición v0.4 (precio dual):** algunos productos se venden por rollo y por metro. El modelo soporta `priceRollo` / `priceMetro` con `unitRollo` (ej. "rollo de 100 m") además del `price` base. La ficha muestra ambos precios cuando existen. Todos con IGV.

**US-04** — Como visitante, quiero cotizar un producto con un clic, para no escribir manualmente todos los datos del producto en el chat.
- **Criterio de aceptación:** al presionar "Cotizar por WhatsApp", se abre WhatsApp (app o web) con un mensaje pre-armado que incluye nombre del producto, medida/calibre y URL de la ficha. El visitante solo escribe cantidad y sus datos.

**US-05** — Como visitante con conexión lenta (obra, campo), quiero que el catálogo cargue rápido, para no abandonar por lentitud.
- **Criterio de aceptación:** ver RNF-1 (rendimiento). La home y las páginas de categoría deben cumplir el umbral definido.

**US-11** — Como visitante, quiero encontrar los productos de Corporación Milán en Google, para llegar sin conocer previamente la marca.
- **Criterio de aceptación:** cada producto tiene URL amigable (ej. `/mallas/malla-electrosoldada-4mm-2.40x6`), meta title y meta description únicos, y aparece en `sitemap.xml`. El sitio está indexable (sin `noindex`) y registrado en Google Search Console.

**US-12** — Como visitante, quiero saber cómo se tratan mis datos si contacto por WhatsApp, para cumplimiento legal y confianza.
- **Criterio de aceptación:** enlace visible a política de privacidad en el footer. La política menciona base legal, finalidad y contacto del titular (Ley 29733 - Perú).

### Panel de administración

**US-06** — Como administrador, quiero iniciar sesión de forma segura, para que solo yo o mi vendedor de confianza pueda cambiar el catálogo.
- **Criterio de aceptación:** pantalla de login con email + contraseña. Sin sesión válida, no se accede a `/admin`. Contraseña con mínimo 10 caracteres. Sesión expira tras 30 días de inactividad.

**US-06b** — Como administrador, quiero recuperar mi contraseña si la olvido, para no depender del desarrollador para reingresar.
- **Criterio de aceptación:** enlace "Olvidé mi contraseña" en el login envía email con link de recuperación válido por 1 hora.

**US-07** — Como administrador, quiero subir fotos de un producto desde mi celular, para no depender de una computadora ni del programador.
- **Criterio de aceptación:** desde el panel en móvil, tomo o selecciono una foto y la subo. El sistema muestra progreso y confirma éxito. Ver US-07b, US-07c para el procesamiento.

**US-07b** — Como administrador, quiero que las fotos se optimicen automáticamente, para que la web cargue rápido sin que yo tenga que editar imágenes.
- **Criterio de aceptación:** cada imagen subida se convierte a WebP, se redimensiona a máximo 1600px de lado mayor, y se comprime a máximo ~200 KB. Se generan variantes thumbnail (~40 KB) y medium (~100 KB) para uso en listados. El admin no ve ni configura este proceso.

**US-07c** — Como administrador, quiero escribir una descripción breve de cada foto, para accesibilidad y para que Google entienda qué muestra la imagen.
- **Criterio de aceptación:** el formulario de subida obliga a llenar un campo "descripción de la imagen" (alt text) antes de guardar. Sugiere texto por defecto basado en nombre del producto pero el admin puede editarlo.

**US-08** — Como administrador, quiero cambiar el precio o stock de un producto en segundos, para reaccionar rápido a cambios de proveedor.
- **Criterio de aceptación:** edito el precio en un campo, presiono guardar, y el cambio se refleja en el catálogo público en menos de 60 segundos (rango definido por la estrategia de caché que decida el plan técnico).

**US-09** — Como administrador, quiero crear un producto nuevo con categoría, fotos, medidas y precio, para expandir el catálogo sin ayuda técnica.
- **Criterio de aceptación:** formulario guiado (paso a paso, no tabla cruda de base de datos) permite crear un producto completo en menos de 3 minutos, con validación clara de campos obligatorios.

**US-10** — Como administrador, quiero marcar un producto como "agotado" sin borrarlo, para no perder la ficha cuando vuelva a tener stock.
- **Criterio de aceptación:** switch de "disponible / agotado" que no elimina el producto. En el catálogo público el producto agotado se muestra con badge visual "Sin stock" y botón de WhatsApp cambia a "Consultar disponibilidad" (no oculta el producto — mantiene SEO). Alternativa: ocultarlo del listado pero mantener la URL accesible con estado 200 y aviso "temporalmente sin stock". Decisión final se toma con el dueño (ver Q-N1 en sección 9).

**US-13** — *(reemplazada por US-14 en v0.3 — Q-N2 resuelta: se descarta GA4/Plausible)*

**US-14** — Como administrador, quiero saber qué productos consulta más la gente, para priorizar stock y negociación con proveedores.
- **Criterio de aceptación:** columna `vistas` (integer) en la tabla `productos`. Cada carga de ficha de producto incrementa la columna de forma atómica (`UPDATE ... SET vistas = vistas + 1`, sin select+update previo, para evitar condiciones de carrera). El panel admin muestra una tabla simple "Top 10 productos más consultados" ordenada por `vistas` descendente. Sin gráficos, sin dashboard externo, sin plataforma de analítica de terceros.
- **🔴 Estado v0.4: NO IMPLEMENTADA.** El schema **no tiene** columna `vistas` y no existe el "Top 10" en el panel. Queda como deuda (§12). El dashboard admin actual solo muestra conteos (total productos, categorías, sin stock, destacados) vía `getAdminStats`.

**US-15** *(nueva v0.4 — retro-especificada desde el código)* — Como administrador, quiero cargar varios productos de una sola vez, para poblar el catálogo rápido sin crear uno por uno.
- **Criterio de aceptación:** existe importación masiva en el panel (`BulkImport.tsx`). *Pendiente documentar el formato de entrada aceptado y validación de duplicados/slug en una revisión posterior.*

---

## 7. Requisitos no funcionales (RNF)

| ID | Categoría | Requisito |
|---|---|---|
| **RNF-1** | Rendimiento | Home y páginas de categoría: LCP (Largest Contentful Paint) < 2.5s en conexión "Slow 4G" simulada de Chrome DevTools (400 Kbps, 400ms RTT). Ficha de producto: LCP < 3s en la misma condición. Métrica verificable con Lighthouse antes de entrega. |
| **RNF-2** | Rendimiento | Imágenes servidas en WebP con fallback JPEG. Peso máx por imagen final: 200 KB (full), 100 KB (medium), 40 KB (thumbnail). Lazy loading obligatorio fuera del viewport. |
| **RNF-3** | Usabilidad | Panel admin usable por persona sin conocimientos técnicos, en español Perú, sin jerga (ej. no decir "SKU", decir "código de producto"). |
| **RNF-4** | Disponibilidad | Catálogo público disponible 24/7 con uptime objetivo ≥ 99% mensual. Downtime aceptable solo por mantenimiento programado y avisado con 24h de anticipación. |
| **RNF-5** | Seguridad | Panel admin protegido por autenticación. Credenciales nunca expuestas en código cliente. Endpoints de escritura requieren sesión válida verificada del lado servidor. Cumplimiento Ley 29733 (Protección de Datos Personales - Perú): política publicada, base legal declarada. |
| **RNF-6** | SEO | URLs amigables (slugs) por producto y categoría. Meta title/description únicos por página. OpenGraph tags para compartir en WhatsApp/Facebook. Sitemap.xml auto-generado. `robots.txt` correcto. Estructura HTML semántica (h1, h2, alt text). |
| **RNF-7** | Escalabilidad | Arquitectura debe soportar cómodamente 500 productos y 1.500 imágenes sin rediseño. Búsqueda debe seguir funcionando en <1s con ese volumen. |
| **RNF-8** | Costos e infraestructura | Objetivo de costo mensual de infraestructura: US$0-25 en v1. Ver sección 8 sobre riesgos del free tier. |
| **RNF-9** | Idioma | Todo el contenido (público y admin) en español (Perú). |
| **RNF-10** | Accesibilidad | Contraste de texto AA (WCAG 2.1). Alt text en todas las imágenes de producto. Formularios con labels asociados. Navegable con teclado en escritorio. |
| **RNF-11** | Backup y recuperación | Base de datos con respaldo diario automático retenido al menos 7 días. Procedimiento documentado de restauración. Imágenes en storage con versionado o respaldo semanal. |
| **RNF-12** | Legal | Política de privacidad publicada. Aviso de tratamiento de datos personales al contactar por WhatsApp. *(Cláusula de consentimiento de cookies eliminada en v0.3 — ya no se usa GA4, el contador de vistas propio no usa cookies de terceros.)* |

---

## 8. Riesgos y supuestos declarados

Estos riesgos deben conocerse antes de firmar el proyecto, no descubrirse en producción.

**R-1 — Free tier de infraestructura y pausa por inactividad.**
Los planes gratuitos de servicios como Supabase pausan el proyecto tras 7 días sin actividad; los de Vercel prohíben uso comercial en Hobby. El plan técnico debe:
- Elegir proveedores cuyo free tier permita uso comercial (ej. Cloudflare Pages, Netlify con condiciones), o
- Presupuestar plan pago desde el inicio (~US$25/mes combinado), o
- Implementar keep-alive automático si se opta por free tier con pausa.
Si no se resuelve, el RNF-4 (uptime 99%) no es alcanzable.

**R-2 — Bandwidth de imágenes.**
Con 100 productos, 3 imágenes promedio, ~200 KB cada una, un visitante que recorre 20 productos consume ~12 MB. 500 visitantes/mes = 6 GB. Free tiers típicos de Supabase Storage dan 5 GB egress/mes. Si el sitio funciona, el free tier se rompe rápido. El plan técnico debe considerar CDN (Cloudflare gratis) delante del storage.

**R-3 — Fotografía del catálogo.**
Se asume que las 100 fotos iniciales no están disponibles con calidad uniforme. Fotografiar productos es trabajo no incluido en la cotización de software y puede duplicar el cronograma. Ver `00c-content-inventory.md`.

**R-4 — WhatsApp Business API vs `wa.me`.**
V1 usa enlaces `wa.me` (gratis, sin aprobación, funciona con WhatsApp personal o Business). Limitación: no permite tracking, plantillas ni multi-agente. Si el cliente necesita esto en v2, migrar a WhatsApp Business Cloud API es un proyecto aparte.

**R-5 — SEO no garantiza tráfico.**
Cumplir RNF-6 hace al sitio *indexable*, no *rankeable*. Posicionarse contra Multitop, Sodimac o Promart en búsquedas competitivas requiere estrategia de contenido y linkbuilding sostenida — no está incluido en v1.

**R-6 — Curva de adopción del panel admin.**
El primer mes el dueño va a necesitar acompañamiento para cargar productos. La capacitación de 15-30 min no cubre esto. Considerar plan de soporte post-lanzamiento en la propuesta comercial.

---

## 9. Preguntas bloqueantes (deben responderse antes del Plan Técnico)

Divididas por impacto. Las **bloqueantes** cambian el modelo de datos o el precio del proyecto y no pueden dejarse "para después". Las **de negocio** afectan el producto. Las **operativas** no bloquean el diseño pero deben cerrarse antes de implementación.

### 🔴 Bloqueantes de arquitectura — TODAS RESUELTAS (v0.3)

**Q-B1 — ✅ RESUELTA.** Estructura confirmada (Zarandas / Mallas / Plásticos / Grass, verificar poblado). "Otros" eliminada. Regla de gobernanza de categorías agregada en sección 5.

**Q-B2 — ✅ RESUELTA.** Precio siempre público. Copy: "Precio referencial, cotización final por WhatsApp según volumen". **Riesgo declarado:** esta redacción puede reducir conversión frente a un precio fijo sin condicional — decisión del dueño, tomada con el riesgo conocido. Monitorear tasa de clic al CTA de WhatsApp vs. vistas de producto (US-14) en las primeras 4 semanas post-lanzamiento para validar o revisar.

**Q-B3 — ✅ RESUELTA.** Sin precios diferenciados mayorista/minorista en v1.

**Q-B4 — ✅ RESUELTA.** Un solo rol administrador (el dueño). No hay vendedor con acceso al panel.

### 🟡 De negocio — TODAS RESUELTAS (v0.3)

**Q-N1 — ✅ RESUELTA.** Badge "Sin stock", no se oculta.

**Q-N2 — ✅ RESUELTA.** Sin GA4/Plausible. Contador de vistas propio (US-14).

**Q-N3 — ✅ RESUELTA.** Precio con IGV incluido, etiqueta fija "Precio incluye IGV".

### 🟢 Operativas

**Q-O1 — Dominio: ¿ya está definido? (`corporacionmilan.pe`, `corporacionmilan.com`, otro).**

**Q-O2 — Identidad visual: ¿hay logo y paleta de colores definidos, o se diseñan como parte del proyecto?**

**Q-O3 — Contenido inicial: ¿las fotos y specs existen, o hay que producirlas?** (Detalle en `00c-content-inventory.md`.)

**Q-O4 — Número de WhatsApp para el botón "Cotizar": ¿uno solo o varios según categoría/región?**

**Q-O5 — ¿El dueño tiene ya Google Search Console y Google Analytics, o se crean nuevos con su correo?**

**Q-O6 *(nueva v0.4)* — ✅ RESUELTA. Target de despliegue: Vercel.** Producción en `corporacion-milan.vercel.app` (Supabase Postgres + Storage). `netlify.toml` eliminado. El build fallido (`ENOTFOUND ... postgres.ckrnygpkocklovbyisat`) era por pausa del free tier de Supabase, ya reactivado. Ver Plan Técnico §Despliegue.

---

## 10. Criterios de "Definition of Done" del proyecto

V1 se considera entregado cuando:

1. Todas las historias de usuario US-01 a US-12 pasan sus criterios de aceptación (US-13 reemplazada por US-14 en v0.3). **US-14 pendiente** (ver §12); US-15 (importación masiva) implementada, falta documentar formato.
2. Todos los RNF-1 a RNF-12 son verificables (Lighthouse, revisión manual, prueba de carga).
3. Los 100 primeros productos están cargados por el admin (no por el desarrollador) durante la capacitación.
4. El dueño puede crear, editar y publicar un producto nuevo sin ayuda, en una prueba grabada.
5. `sitemap.xml` está enviado a Google Search Console y con al menos 1 URL indexada.
6. Política de privacidad publicada y enlazada desde el footer.
7. Backups configurados y probados con una restauración de prueba.
8. Documento de "manual del administrador" entregado en PDF.

---

## 11. Documentos del proyecto — estado real

- **`00-spec.md`** — este documento. ✅ v0.4, alineado con el código.
- **`01-plan-tecnico.md`** — ✅ v2.0, reescrito y alineado con el código (stack real, modelo de datos, pg_trgm, Supabase, despliegue).
- **`00b-competitive.md`** — 🔴 **nunca creado.** Análisis de Multitop, Sodimac, Promart y competidores directos.
- **`00c-content-inventory.md`** — 🔴 **nunca creado.** Inventario de fotos/specs existentes vs. faltantes.
- **`02-tasks.md`** — ✅ creado. Tareas de cierre de deuda (T-01..T-08) + fases de la plantilla white-label (T-P01..T-P06).
- **`03-spec-plantilla.md`** — ✅ nuevo. Convierte este código en **plantilla white-label** (una instancia por cliente, branding editable desde el panel). Corporación Milán pasa a ser la **instancia #1**. Reemplaza la idea de multi-tenant (descartada por peso de fotos).
- **`SPECKIT.md`** (raíz) — documento técnico generado por ingeniería inversa del código. Útil como referencia, pero **`docs/` es la fuente de verdad** cuando difieran.

---

## 12. Deuda técnica y brechas conocidas (v0.4)

Registradas al reconciliar spec ↔ código. No bloquean el uso actual pero deben cerrarse:

1. **US-14 (contador de vistas): no implementada.** Falta columna `vistas` + incremento atómico en la ficha + "Top 10" en el dashboard admin.
2. **Target de despliegue sin consolidar** (Q-O6): Netlify config commiteado vs. Vercel+Supabase activo; build de Vercel falló por DB inalcanzable.
3. **`00b-competitive.md` y `00c-content-inventory.md` no producidos** (§11).
4. **US-15 (importación masiva):** implementada sin especificación — falta documentar formato de entrada y validación de duplicados/slug.
5. **CLAUDE.md desactualizado en un punto:** describe la búsqueda como "filtro de tokens en memoria"; el código real usa **pg_trgm** (`similarity()`). Corregir esa nota.
6. **Seguridad pendiente:** rotar secretos y cambiar `ADMIN_PASSWORD` (fuera del alcance del spec, registrado aparte).
