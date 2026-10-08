# Backlog de mejoras UI/UX — Home y Ficha de producto

> **Para el LLM/agente que ejecute esto:** este documento es autosuficiente. Léelo
> completo antes de tocar código. Cada ítem trae: ubicación exacta, estado actual,
> cambio requerido y criterio de aceptación. No hace falta re-descubrir nada.

## 0. Contexto obligatorio antes de empezar

- **Qué es el proyecto:** catálogo digital white-label de **juguetes**. La conversión
  final NO es checkout online: es un **mensaje de WhatsApp pre-llenado** (`wa.me`).
  Instancia actual ≈ "Central Juguetes", público **peruano** (locale `es-PE`).
- **Lee primero:** `CLAUDE.md` (raíz) y `web/AGENTS.md`. Punto crítico de `AGENTS.md`:
  esto es **Next.js 16 + React 19 + Tailwind 4**, con breaking changes vs. training
  data. **Antes de escribir código Next.js, lee la guía relevante en
  `web/node_modules/next/dist/docs/`.**
- **Todos los comandos corren desde `web/`** (`npm run dev`, `npm run lint`, `npm run build`).
- **Branding por instancia:** nombre, logo, colores, contacto, moneda y legales viven en
  el singleton `SiteSettings` (editable en `/admin/configuracion`) y fluyen vía
  `src/lib/settings.ts` → `getSiteSettings()`. **Nunca hardcodear** nombre de sitio,
  color, WhatsApp ni moneda.
- **Lenguaje:** español peruano en **tuteo** ("Escríbenos", "Cotiza"). **Prohibido voseo**
  ("Escribinos", "Cotizá", "Mirá", etc.).
- **Regla de oro de diseño:** el estilo debe corresponder a una **juguetería** (vivo,
  cálido, amable), no a la plantilla industrial de la que se clonó.
- **Flujo de trabajo:** haz los cambios por bloques (Sprint 1 → 2 → 3). Tras cada bloque
  corre `npm run lint` y `npm run build`. No agrupes cambios no relacionados en un commit.
- **Verde WhatsApp (`--color-whatsapp`) es EXCLUSIVO del CTA de cotización/contacto.** No
  usarlo como color decorativo.

## 1. Convenciones del repo (para no romper el patrón)

- Tokens de color: `brand-*` (marca, rampa inyectada por instancia), `steel-*` (neutros),
  `whatsapp` / `whatsapp-dark`. Definidos en `web/src/app/globals.css`.
- Iconos: SVG inline (nunca emojis como iconos estructurales).
- Imágenes: se usa `<img>` plano (ver `ProductImage.tsx`), NO `next/image`.
- Mutaciones: Server Actions en `src/app/admin/actions.ts`. Lecturas: `src/lib/catalog.ts`.
- Tras cambios de UI no hace falta migración de DB.

---

## PRIORIDADES

- **P0** = crítico (negocio / bloqueante visual). Sprint 1.
- **P1** = importante (jerarquía / adecuación a juguetería). Sprint 2.
- **P2** = pulido / engagement / limpieza. Sprint 3.

Orden de ejecución sugerido:

1. **Sprint 1 (P0):** G-01, G-02, G-03, H-01, F-01, F-02, G-06
2. **Sprint 2 (P1):** G-04, G-05, F-03, F-04, F-05, H-02, H-03
3. **Sprint 3 (P2):** G-07, G-08, H-04, H-05, F-06, F-07, F-08

---

## BLOQUE A — Transversales (afectan Home y Ficha)

### G-01 · [P0] Repaletizar a juguetería

- **Archivo:** `web/src/app/globals.css` (líneas ~15-33) y configuración de la instancia
  en `SiteSettings.brandColor` (panel `/admin/configuracion`).
- **Estado actual:** la rampa `--color-brand-*` tiene como *fallback* un **gris**
  (`#64717a`, `#58636b`, `#464f55`…) heredado de la plantilla industrial; los neutros son
  `steel-*` (gris acero). Si `brandColor` no está bien seteado, la juguetería entera se ve
  gris metálico.
- **Cambio requerido:**
  1. Verificar que `SiteSettings.brandColor` tenga un color vivo propio de juguetería
     (no gris). `src/lib/theme.ts` (`generateBrandRamp()`) deriva la rampa `--brand-*`;
     confirmar que la instancia lo tenga configurado.
  2. Cambiar el *fallback* de `--color-brand-*` en `globals.css` a una rampa cálida/viva
     neutra-amable (NO gris), para que aunque falte config no se vea industrial.
  3. NO hardcodear el color de una marca concreta en el código: el valor real llega de
     `SiteSettings`. El cambio en CSS es solo el fallback.
- **Criterio de aceptación:** con `brandColor` vacío, la UI muestra una rampa de marca con
  color (no gris); con `brandColor` seteado, se respeta el de la instancia. Sin FOUC.

### G-02 · [P0] Localización peruana (eliminar voseo)

- **Archivo:** `web/src/components/layout/Footer.tsx` (líneas 58 y 72).
- **Estado actual:** aparece "**Escribinos** por WhatsApp" (voseo argentino) en el texto de
  la franja de convenios y en el botón.
- **Cambio requerido:** reemplazar ambas ocurrencias "Escribinos" → "**Escríbenos**".
- **Nota:** `CartFab.tsx:57` dice "productos que elegí" — eso es 1ª persona (correcto),
  NO tocar.
- **Criterio de aceptación:** `grep -i "escribinos"` sobre `web/src` no devuelve nada.
  No quedan voseos en toda la UI.

### G-03 · [P0] Unificar el lenguaje de los CTAs

- **Archivos:** `Header.tsx`, `Footer.tsx`, `ProductPurchase.tsx`, `CartFab.tsx`,
  `ProductStickyBar.tsx`, `AskWhatsAppLink.tsx`, `WhatsAppButton.tsx`.
- **Estado actual:** hay 6+ variantes para la misma acción: "Cotizar por WhatsApp",
  "Preguntar por WhatsApp", "Consultar disponibilidad", "Enviar pedido por WhatsApp",
  "Mi cotización", "Escribinos/Cotiza por WhatsApp".
- **Cambio requerido:** reducir a un vocabulario consistente:
  - CTA de producto/carrito → **"Cotizar por WhatsApp"** (o "Agregar a la cotización" +
    "Enviar cotización" dentro del carrito, pero sin mezclar "Preguntar").
  - CTA de contacto general (header/footer) → **"Escríbenos"**.
  - Producto sin stock → **"Consultar disponibilidad"** (único caso que se mantiene).
- **Criterio de aceptación:** cada tipo de acción usa un único verbo consistente en todas
  las pantallas; no hay sinónimos redundantes para la misma acción.

### G-04 · [P1] Reducir ADN industrial en cards y ficha

- **Archivos:** `ProductCard.tsx` (líneas 121-131), `producto/.../page.tsx` (91-101, 171-175).
- **Estado actual:** la card muestra el **SKU en mono sobre el nombre** y specs
  `measure · gauge` ("Calibre", "Material", "Medida") como datos de primer nivel —
  vocabulario de insumos industriales. En juguetes el padre compra por edad/marca/pilas.
- **Cambio requerido:**
  - SKU/"Código" visible pero en tamaño/color claramente secundario (no encima del nombre
    como protagonista).
  - Degradar "Calibre/Material/Medida" a datos secundarios; si vienen vacíos, no renderizar.
- **Criterio de aceptación:** en la card, el orden de prominencia es
  Imagen → Nombre → Edad/Precio; el SKU y specs industriales no compiten con el nombre.

### G-05 · [P1] Subir contraste de textos grises

- **Archivos:** global — `ProductCard.tsx:122,150`, `producto/.../page.tsx:199`,
  `CategoryNav.tsx:76`, `Footer.tsx`, y cualquier `text-steel-400`/`text-steel-500` sobre
  fondo claro para texto normal.
- **Estado actual:** `text-steel-400` (#8b98a1) sobre blanco ≈ 2.8:1 y `text-steel-500`
  (#64717a) ≈ 4.0:1 — ambos por debajo del mínimo WCAG AA (4.5:1) para texto normal.
- **Cambio requerido:** para texto informativo (SKU, etiqueta de precio, contadores, nota)
  usar `text-steel-600` (#4b565e) o `text-steel-700` (#39424a). No tocar texto puramente
  decorativo grande.
- **Criterio de aceptación:** todo texto normal sobre fondo claro cumple ≥4.5:1.

### G-06 · [P0] Resolver colisión CartFab ↔ ProductStickyBar

- **Archivos:** `CartFab.tsx` (línea 133: `fixed bottom-5 right-5 z-40`) y
  `ProductStickyBar.tsx` (línea 42: `fixed inset-x-0 bottom-0 z-30`).
- **Estado actual:** en la ficha, con items en el carrito, el botón flotante "Mi cotización"
  (z-40, esquina inferior derecha) queda **encima** del CTA de WhatsApp de la barra fija
  (z-30, ancho completo). En móvil se tapan.
- **Cambio requerido (elige UNA estrategia y aplícala):**
  - **A (recomendada):** ocultar el `CartFab` dentro de la página de producto (la ficha ya
    tiene su propio CTA + barra fija). El FAB vuelve a aparecer en home/categoría/búsqueda.
  - **B:** cuando la `ProductStickyBar` está visible, desplazar el `CartFab` hacia arriba
    (ej. `bottom-20`) para que no se solapen.
- **Criterio de aceptación:** en móvil (375px), en una ficha con carrito no vacío,
  ningún control inferior tapa a otro; ambos accionables.

### G-07 · [P2] Targets táctiles ≥44px

- **Archivo:** `ProductPurchase.tsx` (líneas 113-191).
- **Estado actual:** botones +/- de tallas `h-7 w-7` (28px) y de cantidad `h-10 w-10` (40px),
  por debajo del mínimo recomendado de 44px.
- **Cambio requerido:** llevar los controles táctiles a ≥44×44px (o ampliar el hit-area con
  padding manteniendo el visual).
- **Criterio de aceptación:** todos los controles interactivos miden ≥44px de área táctil.

### G-08 · [P2] Borrar código muerto

- **Archivo:** `web/src/components/catalog/WhatsAppButton.tsx`.
- **Estado actual:** componente definido pero **no importado en ningún flujo real**
  (verificado por grep: la única coincidencia es su propio archivo).
- **Cambio requerido:** eliminar el archivo (o, si se decide reutilizarlo para G-03,
  integrarlo de verdad). Confirmar que no haya imports colgando.
- **Criterio de aceptación:** `npm run build` pasa sin referencias rotas.

---

## BLOQUE B — Home (`web/src/app/(catalog)/page.tsx`)

### H-01 · [P0] "Más vendidos" no son ventas reales

- **Archivos:** `page.tsx` (líneas 255-287), `src/lib/catalog.ts` (`getFeaturedProducts`,
  líneas 69-75; `getTopViewedProducts`, línea 212).
- **Estado actual:** la sección titulada **"Más vendidos"** se alimenta de
  `getFeaturedProducts()`, que filtra `featured: true` (bandera curada a mano en admin)
  ordenada por `updatedAt`. NO refleja ventas reales → prueba social engañosa.
- **Cambio requerido (elige UNA):**
  - **A:** renombrar el encabezado a **"Destacados"** o **"Nuestra selección"** (honesto con
    lo que es: curaduría del admin).
  - **B:** alimentar la sección de datos reales de consulta usando `getTopViewedProducts()`
    (ordena por `vistas` desc) y entonces sí titular "Más consultados" / "Los más buscados".
- **Criterio de aceptación:** el título de la sección describe fielmente el criterio de los
  productos mostrados; no se afirma "más vendidos" sin datos de ventas.

### H-02 · [P1] Hero sin tope de altura

- **Archivo:** `page.tsx` (líneas 215-220, rama del banner ya diseñado `showOverlayText=false`).
- **Estado actual:** `<img ... className="block w-full h-auto" />` sin `max-height`. Un banner
  alto puede empujar todo el catálogo por debajo del pliegue en móvil (mal LCP y menos scroll).
- **Cambio requerido:** limitar la altura del hero (ej. `max-h-[60vh]` o `max-h-[520px]` con
  `object-cover` / `object-contain` según diseño), asegurando que productos o un indicador de
  scroll queden visibles above-the-fold en móvil.
- **Criterio de aceptación:** en 375px de ancho, al cargar la home se ve el hero + inicio del
  contenido siguiente sin un hero que ocupe toda la pantalla.

### H-03 · [P1] Mega-menú solo hover/focus

- **Archivo:** `web/src/components/layout/CategoryNav.tsx` (líneas 46-48).
- **Estado actual:** el mega-menú se abre con `group-hover`/`group-focus-within` (desktop).
  No cierra con `Esc` ni tiene comportamiento táctil para tablets.
- **Cambio requerido:** añadir cierre con tecla `Esc` y asegurar que sea operable por teclado
  de forma predecible. (Lee la guía Next.js antes de introducir estado de cliente si hace
  falta convertir a client component.)
- **Criterio de aceptación:** el menú se puede abrir/cerrar con teclado y cerrar con `Esc`;
  el foco no queda atrapado.

### H-04 · [P2] Conversión solo desde la ficha

- **Archivo:** `web/src/components/catalog/ProductCard.tsx` (línea 73: toda la card es un
  único `<Link>` a la PDP).
- **Estado actual:** no hay acción rápida desde la grilla; toda conversión exige abrir la
  ficha. Es limpio para accesibilidad pero reduce velocidad de engagement.
- **Cambio requerido (opcional, evaluar con el dueño):** considerar una acción rápida sutil
  (ej. botón flotante "Cotizar" o favorito) sin romper el patrón de "toda la card es
  clickable" (usar `z-index` y `pointer-events` como ya se hace con los badges).
- **Criterio de aceptación:** si se implementa, el link principal de la card sigue funcionando
  y la acción rápida no interfiere con él.

### H-05 · [P2] Badge de edad poco visible en la card

- **Archivo:** `ProductCard.tsx` (líneas 132-134).
- **Estado actual:** la edad aparece como `text-xs text-brand-600`, discreta.
- **Cambio requerido:** hacerla un badge/pill más reconocible (la edad es el filtro #1 de un
  padre). Mantener coherencia con los otros badges de la card.
- **Criterio de aceptación:** la edad recomendada se identifica de un vistazo en la grilla.

---

## BLOQUE C — Ficha de producto (`web/src/app/(catalog)/producto/[categorySlug]/[productSlug]/page.tsx`)

### F-01 · [P0] Un solo CTA primario alineado al negocio

- **Archivos:** `web/src/components/catalog/ProductPurchase.tsx` (línea 200, botón "Agregar a
  la cotización", color de marca sólido) y `web/src/components/catalog/AskWhatsAppLink.tsx`
  (CTA "Preguntar por WhatsApp", verde *outline*, secundario).
- **Estado actual:** el botón visualmente dominante es "Agregar a la cotización" (marca,
  sólido), mientras que el objetivo de negocio real (WhatsApp) es el secundario (*outline*).
  Dos primarios compiten.
- **Cambio requerido:** definir UN CTA primario claro. Recomendación: el flujo de cotización
  (carrito → "Enviar cotización por WhatsApp") es el camino principal; "Agregar a la
  cotización" puede seguir siendo el botón de marca sólido PERO el enlace directo a WhatsApp
  debe dejar de competir como segundo botón sólido. Alinear jerarquía: un primario, un
  secundario subordinado. No dejar dos botones del mismo peso visual.
- **Criterio de aceptación:** en la ficha hay un único CTA primario inequívoco; el resto es
  claramente secundario. La ruta a WhatsApp (objetivo de negocio) no queda escondida.

### F-02 · [P0] Unificar la barra fija con el panel principal

- **Archivo:** `web/src/components/catalog/ProductStickyBar.tsx` (líneas 61-73).
- **Estado actual:** al hacer scroll aparece una barra inferior con "Preguntar por WhatsApp"
  que dispara `trackWhatsappQuestion` y **salta el flujo de cotización/carrito** del panel
  principal. El usuario que venía armando una cotización recibe otra acción distinta.
- **Cambio requerido:** que la barra fija ofrezca la MISMA acción primaria que el panel
  principal (coherente con F-01), no un flujo paralelo de "pregunta". Si el primario es
  cotizar, la barra fija debe cotizar.
- **Criterio de aceptación:** el CTA de la barra fija y el del panel principal llevan al mismo
  flujo; el texto coincide con G-03.

### F-03 · [P1] Badge de edad recomendada junto al título

- **Archivo:** `page.tsx` (bloque eyebrow/título, líneas ~155-175).
- **Estado actual:** la edad recomendada solo aparece dentro del acordeón "Detalles técnicos"
  (líneas 94-96).
- **Cambio requerido:** mostrar un badge de edad (ej. "3–6 años") junto al título o en el
  eyebrow, visible sin abrir ningún acordeón. Usar `ageMin`/`ageMax` del producto.
- **Criterio de aceptación:** la edad es visible en el primer viewport de la ficha.

### F-04 · [P1] Reordenar specs para juguetería

- **Archivo:** `page.tsx` (array `specs`, líneas 91-101).
- **Estado actual:** el orden es Medida → Calibre → Material → Edad → Pilas (prioriza datos
  industriales).
- **Cambio requerido:** reordenar para que lo relevante en juguetes vaya primero:
  **Edad recomendada → Incluye pilas → (Contenido de caja y Advertencias ya son acordeones
  aparte) → Material → Medida/Calibre al final** (y omitir los vacíos, como ya hace el
  `.filter`).
- **Criterio de aceptación:** en "Detalles técnicos", Edad y Pilas aparecen antes que
  Calibre/Medida.

### F-05 · [P1] Acordeones cerrados por defecto (salvo Descripción)

- **Archivo:** `page.tsx` (bloques `<details ... open>` en líneas 259, 274, 294, 311, 326).
- **Estado actual:** los 5 acordeones (Descripción, Detalles técnicos, Video, Contenido de
  caja, Advertencias) abren con `open` → ficha larguísima, sin *progressive disclosure*.
- **Cambio requerido:** dejar **solo "Descripción del producto" con `open`**; quitar `open`
  de Detalles técnicos, Video y Contenido de caja. **Advertencias de seguridad:** evaluar
  dejar abierto por ser información crítica (decisión del dueño; por defecto, mantener abierto).
- **Criterio de aceptación:** al cargar la ficha, solo Descripción (y opcionalmente
  Advertencias) están expandidos; el resto colapsado.

### F-06 · [P2] Declarar dimensiones de imagen (evitar CLS)

- **Archivo:** `web/src/components/catalog/ProductGallery.tsx` (línea 38, imagen principal;
  y thumbnails líneas 94-98).
- **Estado actual:** `<img>` sin `width`/`height` explícitos. El contenedor usa `aspect-square`
  (ayuda), pero conviene reservar espacio de forma explícita.
- **Cambio requerido:** asegurar reserva de espacio (mantener `aspect-square` en el contenedor
  y/o declarar dimensiones) para que no haya salto de layout al cargar la foto.
- **Criterio de aceptación:** CLS ≈ 0 al cargar la ficha; la foto no "empuja" el contenido.

### F-07 · [P2] Evaluar retirar el modo "tallas" (herencia de ropa)

- **Archivos:** `page.tsx` (`parseSizes`, líneas 22-31) y `ProductPurchase.tsx` (modo tallas,
  usa la palabra "pares").
- **Estado actual:** la ficha detecta "tallas" desde el campo `measure` y muestra un selector
  de tallas/cantidades hablando de "par/pares" — lógica heredada de un catálogo de calzado/ropa.
  En juguetes casi nunca aplica y añade complejidad y copy confuso.
- **Cambio requerido (evaluar con el dueño):** o bien retirar el modo tallas en esta instancia,
  o aislarlo tras una condición/bandera para que la PDP de juguetes solo muestre el selector de
  cantidad simple. No romper instancias que sí vendan ropa.
- **Criterio de aceptación:** en productos de juguete, la ficha muestra solo el contador de
  cantidad simple; no aparece "par/pares".

### F-08 · [P2] Cerrar galería con Esc y confirmar swipe móvil

- **Archivo:** `ProductGallery.tsx`.
- **Estado actual:** navegación por flechas y thumbnails OK y accesible; falta cierre/escape por
  teclado si se añade un modo zoom/lightbox, y confirmar gesto swipe en móvil.
- **Cambio requerido:** soportar `Esc` donde aplique y verificar que el swipe horizontal cambie
  de imagen en móvil sin conflictos con el scroll vertical.
- **Criterio de aceptación:** galería operable por teclado y por gestos táctiles sin conflicto.

---

## Checklist final antes de entregar cada sprint

- [ ] `npm run lint` sin errores nuevos.
- [ ] `npm run build` pasa.
- [ ] Probado en 375px (móvil chico) y desktop.
- [ ] Sin voseo en toda la UI.
- [ ] Verde WhatsApp solo en CTAs de contacto/cotización.
- [ ] Ningún texto normal gris-sobre-gris bajo 4.5:1.
- [ ] Ningún control táctil < 44px.
- [ ] Nada hardcodeado que deba venir de `SiteSettings`.
