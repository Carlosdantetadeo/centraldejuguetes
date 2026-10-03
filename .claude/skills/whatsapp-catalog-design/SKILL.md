---
name: whatsapp-catalog-design
description: Usa este skill SIEMPRE que construyas o modifiques frontend de un catálogo digital tipo "AI-commerce" en React + Tailwind cuya conversión final es WhatsApp (no checkout en línea). Se activa con: catálogo de productos, storefront B2B, landing de productos con cotización, o cualquier componente de cards/categorías/carrito que termine en un mensaje de WhatsApp en vez de un pago. Sincronizado con 00-spec.md v0.3 de Corporación Milán (preguntas bloqueantes ya resueltas) — si el proyecto tiene una spec propia, ESA spec manda sobre cualquier regla genérica de este documento.
---

# Diseño de catálogo AI-commerce → WhatsApp

Este NO es un ecommerce con checkout. Es un catálogo conversacional. La spec del proyecto (`00-spec.md`) define el QUÉ — este skill define el CÓMO se ve y se comporta. Si hay conflicto, gana la spec, y este documento se corrige.

## Regla 0: nunca publicar vacíos como si fueran contenido

- Categoría con 0 productos → NO se muestra en el grid principal. Se oculta o va colapsada al fondo como "Próximamente".
- **Gobernanza de categorías (obligatoria):** no se crea ni se publica una categoría nueva sin tener mínimo 2-3 productos reales para poblarla en el momento de la creación. No crear categorías "porque ya se sabe que van a llegar productos" — ese patrón fue el origen de "Grass" y "Otros" apareciendo vacías o mal definidas en producción. Antes de eliminar una categoría existente, verificar y reasignar cualquier producto huérfano que dependa de ella.
- Producto sin foto → nunca un cuadro gris "Sin foto" flotando. Reemplazar por ficha técnica tipográfica (medida, calibre, unidad) en fuente monoespaciada.

## Precio (Q-B2, Q-N3 resueltas — implementación fija, sin flags condicionales)

El precio siempre se muestra, con estos tres elementos fijos y visibles juntos en la ficha de producto y en las cards de listado:
1. Monto con IGV incluido.
2. Etiqueta fija: **"Precio incluye IGV"**.
3. Nota: **"Precio referencial, cotización final por WhatsApp según volumen"**, ubicada junto al precio (no como texto perdido en un párrafo aparte) y acompañada del ícono/badge de WhatsApp para que se lea como flexibilidad, no como precio dudoso.

No implementar el componente `PrecioProducto` con variantes `visible`/`consultar` de versiones anteriores de este skill — esa decisión ya está cerrada, el precio es siempre público.

**Riesgo de conversión declarado:** la palabra "referencial" puede leerse como que el precio no es confiable, lo cual compite en desventaja contra catálogos con precio fijo (Multitop, Promart, Sodimac). Es una decisión del dueño tomada con este riesgo conocido. Cuando el contador de vistas (US-14) esté funcionando, monitorear tasa de clic al CTA de WhatsApp vs. vistas de producto en las primeras 4 semanas — si la tasa es baja comparada con el volumen de vistas, este copy es el primer sospechoso a revisar.

## Contador de vistas (US-14 — reemplaza analítica externa)

No se integra GA4 ni Plausible. Implementación:
- Columna `vistas` (integer, default 0) en tabla `productos`.
- Incremento atómico en cada carga de ficha de producto: `UPDATE productos SET vistas = vistas + 1 WHERE id = $1` — nunca select+update, para evitar condición de carrera con tráfico concurrente.
- Panel admin: tabla simple "Top 10 productos más consultados", ordenada por `vistas` descendente. Sin gráficos, sin dashboard externo.

## Flujo de conversión: UN producto por vez, no un carrito (v1)

`00-spec.md` sección 3 excluye "Carrito multi-producto con checkout" del alcance v1. US-04 define el flujo real: botón "Cotizar por WhatsApp" en la ficha de producto individual → abre WhatsApp con mensaje pre-armado (nombre, medida/calibre, URL de la ficha) → el visitante escribe cantidad y datos manualmente.

- NO construir un tray/panel flotante que acumule varios productos — es scope de v2, no aprobado.
- El CTA de WhatsApp es el elemento de firma de v1: botón visualmente prominente, mensaje generado legible, confirmación visual antes de abrir WhatsApp.

## Vocabulario

| Nunca usar | Usar en su lugar |
|---|---|
| "Carrito" / ícono de bolsa | No aplica en v1 — botón "Cotizar por WhatsApp" por producto |
| "Agregar al carrito" | "Cotizar este producto" |
| "Finalizar compra" / checkout de pasos | No existe — el flujo termina al abrir WhatsApp con un producto |
| "Consultar precio" | No aplica — el precio siempre se muestra (Q-B2 resuelta) |

## Paleta

1 color de marca + 1 acento funcional + escala de neutros. Verde WhatsApp (#25D366) exclusivo para el CTA de WhatsApp — no en precios, badges ni links. Footer con la misma paleta clara del resto de la página.

## Evitar los 3 defaults de IA detectables a simple vista

1. Fondo crema + degradado rosa pálido + acento terracota (~#D97757) + eyebrow en mayúsculas.
2. Fondo casi negro + acento acid-green/vermilion.
3. Layout broadsheet con hairlines y cero border-radius.

## Header y ficha de producto

Header discreto, sin protagonismo de dashboard interno (RNF-3: lenguaje sin jerga técnica, "código de producto" no "SKU", aplica también a UI pública).

Ficha de producto (US-03) muestra: 1 foto mínimo, precio con IGV + nota referencial (ver arriba), specs técnicas, badge "Sin stock" si agotado (US-10, Q-N1 resuelta — nunca ocultar silenciosamente).

## Tipografía

Display face con carácter para headline (restraint), body face distinta, monoespaciada para datos técnicos (medidas, precios, códigos).

## Grid de productos

Mínimo 3 columnas en "destacados" incluso con pocos productos. Skeleton cards con "Próximamente" en vacíos, nunca blanco huérfano.

## Checklist antes de dar por terminado cualquier componente

- [ ] ¿El componente asume carrito multi-producto? → eliminar, v1 es un producto a la vez.
- [ ] ¿Hay un precio oculto o modo "consultar"? → corregir, el precio siempre es visible (Q-B2 resuelta).
- [ ] ¿El precio muestra IGV incluido + etiqueta "Precio incluye IGV" + nota referencial? → si falta alguno, completar.
- [ ] ¿Existe una categoría nueva sin mínimo 2-3 productos reales? → no publicar, regla de gobernanza.
- [ ] ¿Sigue existiendo la categoría "Otros"? → debió eliminarse, verificar productos huérfanos reasignados.
- [ ] ¿Alguna categoría o sección se muestra con 0 productos? → ocultar.
- [ ] ¿Aparece algún "Sin foto" gris sin información? → reemplazar por ficha técnica.
- [ ] ¿Hay más de 2 colores de acento sueltos? → consolidar paleta.
- [ ] ¿El vocabulario usa "carrito"/"checkout"/"comprar"? → corregir.
- [ ] ¿Existe el contador de vistas (US-14) y el top 10 en el panel admin? → implementar si falta.
- [ ] ¿El CTA de WhatsApp es el elemento visualmente más fuerte de la ficha? → si no, resaltarlo.
- [ ] ¿El header se parece a un panel admin? → simplificar.
- [ ] ¿La hero cae en alguno de los 3 defaults de IA? → cambiar al menos un eje.
