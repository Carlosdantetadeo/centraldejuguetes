# PROMPT — Frontend de tienda de juguetes (catálogo → WhatsApp)

> Pegar en Claude Code desde la raíz del repo del ecommerce. Reemplaza todo lo que está entre `[[...]]` antes de ejecutar.

---

## 1. Contexto del negocio

Vas a construir (o rehacer) el frontend de una **tienda web de juguetes** para el mercado peruano. Cliente: **[[NOMBRE DE LA TIENDA / Importaciones Grupo Villar]]**, importador de juguetes y útiles en el Centro de Lima.

**Esta web NO es un ecommerce con checkout.** Es un catálogo que califica al cliente y le pasa el pedido a WhatsApp con todo el contexto. El flujo completo es:

1. El cliente navega el catálogo, arma su pedido y toca "Enviar pedido por WhatsApp".
2. La web **registra un pre-pedido en Supabase** con un código único (ej. `P-10427`) y abre WhatsApp con un mensaje ya escrito que incluye ese código.
3. El **agente de IA en Kapso** (Agent Node + Functions alojadas en Kapso) recibe el mensaje, busca el pedido por código, confirma stock y precio, y deriva a un humano cuando hace falta.
4. El pago se verifica en las cuentas del cliente (en horario de oficina). La orden pasa al **sistema de gestión de órdenes existente** y la importadora coordina la entrega.

Quedan **fuera de alcance**: pasarela de pago, login o cuentas de usuario, checkout tradicional.

## 2. Plataforma existente — LEER ANTES DE ESCRIBIR CÓDIGO

Este repo ya tiene un ecommerce construido. Hay restricciones duras:

- **El catálogo vive en un proyecto de Supabase central y compartido.** Lo consumen otros agentes de Kapso de otras empresas y sectores. Cualquier cambio de esquema debe ser **aditivo** (columnas nuevas nullable, tablas nuevas). Prohibido renombrar, borrar o cambiar el tipo de columnas existentes. Prohibido cambiar políticas RLS existentes sin aprobación.
- **El agente de Kapso lee este catálogo.** No rompas los campos ni las vistas que usa.
- Existe un **sistema de gestión de órdenes de compra**. El pre-pedido web debe integrarse con él (o quedar en una tabla compatible), no crear un sistema paralelo.

### Fase 0 — Auditoría (NO escribas código todavía)
Entrégame un reporte breve con:
1. Stack real: framework y versión, router, estilos, librería de UI y hosting.
2. Esquema actual de Supabase relevante: productos, categorías, stock, precios, imágenes, órdenes y el campo de empresa/tenant si existe. Indica cómo se filtra el catálogo por empresa.
3. Qué campos y vistas consume hoy el agente de Kapso (busca en el código o pregúntame si no está en el repo).
4. Qué existe ya del frontend y qué recomiendas reutilizar o descartar.
5. La lista exacta de migraciones que propones (SQL), marcadas como aditivas.

**Detente y espera mi aprobación** antes de aplicar migraciones o borrar código.

## 3. Referencias de diseño (qué tomar y qué evitar)

**Tomar de Melissa & Doug (melissaanddoug.com):**
- "Comprar por edad" como primer ítem del menú y repetido en la home.
- Menú de regalos: por edad, por precio, regalos pequeños, packs.
- Un solo mensaje de campaña coherente en la barra superior, el hero y la franja intermedia.
- Mega menú con un destacado (producto o colección) por categoría.
- Footer que responde dudas antes de comprar: envíos, cambios, garantía, seguridad.

**Evitar (errores vistos en Melissa & Doug y Oriflame Perú):**
- Más de 8 productos en un bloque de la home.
- Mostrar productos agotados en la home.
- Un precio en la tarjeta distinto del precio final (descuentos "con código").
- Un carrusel hero que mezcla mensajes o públicos.
- Navegación principal por marca en vez de por necesidad.
- Descuentos inflados en todo el catálogo.
- Bloques vacíos.
- Alt text genérico o autogenerado.
- Título duplicado o sin palabras clave.
- Menú que solo existe en JS (el menú debe estar en el HTML del servidor).

## 4. Arquitectura de la home (móvil primero, en este orden)

1. **Barra superior fija:** horario de atención por WhatsApp · envíos Lima/provincias · Yape/Plin. El contenido sale de la configuración, no del código.
2. **Header:** logo, buscador visible (no escondido tras un ícono en desktop), ícono de pedido con contador, botón de WhatsApp. Sin login.
3. **Hero fijo (no carrusel):** campaña activa, fecha límite de pedido y un solo CTA. Configurable desde la base de datos (`campaigns`): título, subtítulo, imagen, CTA, URL, fecha de inicio y de fin.
4. **Comprar por edad:** 0–2, 3–5, 6–8, 9–12, 13+ (círculos grandes que llevan al listado filtrado).
5. **Comprar por presupuesto:** hasta S/ 50, S/ 50–100, S/ 100–200, más de S/ 200.
6. **Más vendidos:** máximo 8 productos, **solo con stock > 0**.
7. **Por tipo de juego:** construcción, muñecas, vehículos, juegos de mesa, didácticos/STEM, aire libre (o las categorías reales del catálogo).
8. **Marcas y licencias:** una fila de logos con link, ubicada **debajo** de edad y presupuesto.
9. **"¿No sabes qué regalar?":** quiz de 3 pasos (edad → presupuesto → interés) que muestra 3 sugerencias y un botón que abre WhatsApp con las respuestas ya escritas.
10. **Prueba social:** reseñas y fotos de clientes, desde una tabla configurable (no hardcodeadas).
11. **Footer:** envíos y zonas, cambios y garantía, libro de reclamaciones virtual, razón social y RUC, términos, privacidad, contacto, redes.

## 5. Listado de productos (PLP)

- Filtros: edad, rango de precio, categoría, marca/licencia y "solo disponibles" (activo por defecto).
- Los filtros se reflejan en la URL (compartible, indexable).
- Orden: más vendidos, menor precio, mayor precio, novedades.
- Paginación o "cargar más" (sin scroll infinito sin URL).

**Tarjeta de producto:** imagen, nombre, **precio final en S/ (IGV incluido)**, edad recomendada, badge de stock ("Últimas X unidades" solo si es real) y botón primario "Agregar al pedido".

## 6. Ficha de producto (PDP)

- Galería y **video corto** si existe (`video_url`).
- Precio final, edad mínima y máxima, medidas, materiales, **pilas incluidas sí/no**, contenido de la caja.
- Advertencias de seguridad (ej. "Contiene piezas pequeñas. No apto para menores de 3 años") desde el campo `safety_warnings`.
- CTA "Agregar al pedido" y CTA secundario "Preguntar por WhatsApp", que abre un mensaje con el SKU.
- Productos relacionados: misma edad y rango de precio.
- JSON-LD `Product` con precio, moneda PEN y disponibilidad.

## 7. El mecanismo central: pedido → WhatsApp

**Pedido local:** se guarda en el navegador (localStorage envuelto en try/catch). Permite cambiar cantidades, eliminar items, marcar "es para regalo (envolver)" y elegir el distrito o la ciudad de entrega.

**Al tocar "Enviar pedido por WhatsApp":**
1. Revalidar precio y stock contra Supabase. Si algo cambió, avisar antes de continuar.
2. Insertar un pre-pedido en Supabase (tabla `web_preorders` o la que sea compatible con el sistema de órdenes) con:
   - código (`P-` + secuencial o corto único)
   - items (SKU, cantidad, precio unitario al momento)
   - total, distrito, flag de regalo
   - UTM y origen capturados (ver sección 8)
   - empresa/tenant
   - estado `iniciado_web`
   - timestamp
3. Abrir `https://wa.me/[[51XXXXXXXXX]]?text=` con el mensaje codificado:

```
Hola, quiero hacer este pedido (#P-10427):
• 1x Cocina de madera Chef – S/ 289 (SKU CK-01)
• 2x Rompecabezas 48 pzas – S/ 59 c/u (SKU RZ-48)
Total: S/ 407
Entrega: Surco
Regalo: Sí, envolver
```

4. **Si el insert falla, igual abrir WhatsApp** con el mensaje completo (sin código). Nunca bloquear la venta.
5. La inserción debe hacerse por una ruta de servidor o una función, **no con la service key en el cliente**. Aplicar rate limit básico por IP.

**Función para el agente de Kapso:** expón (o documenta) cómo el agente obtiene el pedido por código, para que no tenga que interpretar texto libre. Si ya existe un patrón de Functions en Kapso, sigue ese patrón. Entrega el contrato: input `codigo` → output JSON con items, total, distrito, regalo y estado.

## 8. Medición (sin checkout no hay atribución si no se hace esto)

- Capturar `utm_source`, `utm_medium`, `utm_campaign`, `fbclid` y `gclid` en la primera visita, persistirlos y guardarlos en el pre-pedido.
- Eventos de GA4 y del Pixel de Meta: `view_item`, `add_to_cart`, `view_cart` y un evento custom `whatsapp_order` (con valor y moneda PEN) al enviar el pedido. Agregar también `whatsapp_question` para el CTA de consulta.
- Los IDs de GA4 y Pixel van en variables de entorno: `[[GA4_ID]]`, `[[META_PIXEL_ID]]`.

## 9. Cambios de datos necesarios (proponer como migración aditiva)

Columnas nuevas en productos (todas nullable):
- `age_min`, `age_max`
- `safety_warnings`
- `batteries_included`
- `video_url`
- `brand_license`
- `is_featured`
- `sales_rank` (o calcularlo desde las órdenes)

Tablas nuevas:
- `campaigns`
- `testimonials`
- `web_preorders` (si no hay una tabla compatible)
- `store_settings` (horario, número de WhatsApp, zonas de envío, textos de la barra superior)

Todo filtrado por empresa/tenant. No tocar lo que usan otros agentes.

## 10. Requisitos técnicos

- Renderizado en servidor o estático con revalidación para home, PLP y PDP. Menú y footer en el HTML inicial.
- Imágenes optimizadas (WebP/AVIF, tamaños responsive, lazy load fuera del primer pantallazo).
- **Meta:** LCP < 2.5 s en móvil 4G y CLS < 0.1.
- **SEO:**
  - Título de la home: "[[Nombre]] – Juguetes en Lima con envío a todo el Perú".
  - Title y description únicos por categoría y producto.
  - Un solo H1 por página.
  - Alt text = nombre del producto + atributo clave.
  - sitemap.xml, robots.txt y canonical.
- **Accesibilidad:** enlaces de "saltar al contenido", contraste AA, foco visible y botones con texto (no solo íconos).
- **Legal Perú:** libro de reclamaciones virtual, razón social y RUC visibles, precios con IGV incluido, política de cambios y devoluciones.
- **Sin datos hardcodeados de campaña:** todo lo estacional se cambia desde la base de datos.

## 11. Datos que debo darte (no los inventes; usa placeholders y lístalos al final)

- Número de WhatsApp, horario de atención, zonas y tiempos de envío.
- Logo, colores y tipografía (si no hay, propón una paleta y espera aprobación).
- **Modelo de venta: ¿solo minorista, solo mayorista o ambos?** Si hay mayorista, define con el cliente: precio por unidad vs. por docena, pedido mínimo y si se muestran dos precios. **No avances con precios hasta tener esta respuesta.**
- Categorías reales del catálogo y las marcas/licencias que maneja.
- Campaña activa y fecha límite de pedido para Navidad.

## 12. Plan de entrega (con checkpoint en cada fase)

1. **Fase 0:** auditoría y propuesta de migraciones → espero aprobación.
2. **Fase 1:** migraciones aditivas, configuración, layout (barra superior, header, footer) y home completa.
3. **Fase 2:** PLP con filtros y PDP.
4. **Fase 3:** pedido → pre-pedido → WhatsApp, más la función para Kapso.
5. **Fase 4:** medición (GA4/Pixel/UTM), SEO, rendimiento y pruebas en móvil real.

Al final de cada fase: lista de archivos cambiados, cómo probarlo y pendientes.

## 13. Criterios de aceptación

- [ ] Desde móvil, un usuario llega a un producto filtrado por edad y presupuesto en ≤ 3 toques.
- [ ] Ningún producto sin stock aparece en la home.
- [ ] El precio de la tarjeta, de la ficha y del mensaje de WhatsApp es siempre el mismo.
- [ ] Cada clic en "Enviar pedido" genera un pre-pedido con código y UTM en Supabase, y un evento `whatsapp_order`.
- [ ] Si Supabase falla, WhatsApp igual se abre con el pedido completo.
- [ ] El agente de Kapso puede obtener cualquier pedido por su código.
- [ ] Cambiar la campaña de Navidad no requiere deploy.
- [ ] Ninguna migración modifica o borra estructuras existentes del catálogo compartido.
- [ ] Lighthouse móvil: Performance ≥ 85, SEO ≥ 95, Accesibilidad ≥ 90.
