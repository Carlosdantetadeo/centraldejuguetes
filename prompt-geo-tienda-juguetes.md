# PROMPT — Optimización GEO (Generative Engine Optimization) de la tienda de juguetes

> Pegar en Claude Code desde la raíz del repo, **después** de terminar las Fases 0–3 del prompt de frontend. Reemplaza todo lo que está entre `[[...]]`.

---

## 1. Objetivo

Que la tienda **[[NOMBRE]]** sea **encontrada, entendida y citada** por los motores de respuesta con IA: ChatGPT (search y shopping), Google AI Overviews / AI Mode / Gemini, Perplexity, Claude y Copilot. El caso de uso típico es una consulta como *"¿qué le regalo a un niño de 5 años por menos de S/ 100 en Lima?"*, *"juguetes didácticos de madera en Lima"* o *"dónde comprar [licencia] en Lima con envío"*.

**Principio rector:** los motores de IA recuperan contenido desde índices de búsqueda y feeds de producto, y lo interpretan con datos estructurados. No hay trucos. El orden de prioridad es:

1. Ser rastreable.
2. Ser entendible (schema y HTML limpio).
3. Estar en los feeds.
4. Tener contenido que responda preguntas reales.
5. Medir.

Prohibido:
- Cloaking (servir contenido distinto a bots y a humanos).
- Texto oculto "para IA".
- Keyword stuffing.
- Reseñas o `AggregateRating` inventados.

## 2. Contexto de la plataforma (respetar)

- Frontend propio construido en este repo, con catálogo en un **Supabase central compartido** por otras empresas y agentes de Kapso. Cualquier cambio de esquema debe ser **aditivo** y requiere mi aprobación.
- **La venta se cierra por WhatsApp** (no hay checkout). Los feeds y el schema apuntan a la ficha del producto (PDP). La conversión se mide con el evento `whatsapp_order` ya implementado.
- Multi-tenant: todo el contenido, schema y feeds se filtran por la empresa **[[TENANT_ID]]**.

## 3. Fase 0 — Auditoría GEO (sin escribir código)

Entrégame un reporte con estado ✅/❌ y evidencia de:

1. **Renderizado:** haz `curl` (sin JS) a la home, a una categoría y a una PDP. ¿El HTML inicial trae nombre, precio, disponibilidad, descripción, menú y footer? Asume que los crawlers de IA **no ejecutan JavaScript**. Todo contenido que dependa de JS es invisible para ellos.
2. **robots.txt actual** y qué bots de IA permite o bloquea.
3. **Bloqueo en el borde:** ¿el hosting, CDN o WAF (Vercel, Cloudflare u otro) tiene activado algún "bloqueo de bots de IA" o desafío anti-bot que corte a estos crawlers aunque robots.txt los permita? Revisa la configuración y dime dónde se cambia.
4. **Datos estructurados** existentes por tipo de página (valídalos con el Rich Results Test o un parser local).
5. **sitemap.xml:** ¿existe, incluye PDP/PLP, tiene `lastmod` real y está declarado en robots.txt?
6. **Metadatos:** title y description únicos, un solo H1, canonical y `hreflang` (no hace falta si es solo es-PE).
7. **Calidad de datos del catálogo** para esta empresa: % de productos con descripción > 300 caracteres, edad, medidas, materiales, marca, GTIN/EAN, imagen principal y stock real.
8. **Logs:** ¿podemos ver los user-agents que visitan el sitio (logs del hosting)? Si no, propón cómo capturarlos.

**Detente y espera mi aprobación.**

## 4. Fase 1 — Rastreabilidad

### 4.1 robots.txt
Permitir explícitamente los bots de **búsqueda y de fetch por usuario**:

```
User-agent: OAI-SearchBot
Allow: /
User-agent: ChatGPT-User
Allow: /
User-agent: Claude-SearchBot
Allow: /
User-agent: Claude-User
Allow: /
User-agent: PerplexityBot
Allow: /
User-agent: Perplexity-User
Allow: /
User-agent: Googlebot
Allow: /
User-agent: Bingbot
Allow: /
```

Bots de **entrenamiento** (`GPTBot`, `ClaudeBot`, `Google-Extended`, `Applebot-Extended`, `CCBot`): **[[DECISIÓN DEL CLIENTE: permitir / bloquear]]**. Mi recomendación para un retailer de juguetes es permitirlos, porque el catálogo no es contenido sensible y estar en el entrenamiento ayuda al reconocimiento de marca.

Bloquear para todos: `/api/`, `/admin`, URLs de pedido y parámetros de tracking. Incluir `Sitemap: https://[[DOMINIO]]/sitemap.xml`.

### 4.2 Borde / WAF
Desactivar cualquier bloqueo genérico de "AI bots" del CDN para los user-agents de búsqueda listados arriba. Mantener rate limiting contra scrapers sin identificar.

### 4.3 Indexación
- `sitemap.xml` dinámico desde Supabase (home, categorías, edades, rangos de precio, guías y PDP con stock). `lastmod` = `updated_at` real.
- Implementar **IndexNow** (lo usan Bing y Copilot, y el índice de Bing alimenta a varios motores de IA). Ping automático cuando cambian el precio, el stock o un producto nuevo.
- Todo el contenido clave en el HTML del servidor (SSR/SSG/ISR). Cero contenido crítico detrás de clics, tabs cerrados con JS o carga diferida.

## 5. Fase 2 — Datos estructurados (JSON-LD, generado desde la base de datos)

| Página | Schema |
|---|---|
| Global | `Organization` (nombre, logo, `sameAs` a redes y Google Business Profile, contacto con WhatsApp) + `WebSite` con `SearchAction` |
| Home / Contacto | `Store` (subtipo de LocalBusiness): dirección [[Centro de Lima]], horario, teléfono, `geo`, `priceRange`, `areaServed` |
| PDP | `Product`: name, description, image[], sku, gtin (si existe), brand, `audience` → `PeopleAudience` con `suggestedMinAge`/`suggestedMaxAge`, material, `Offer` (price, `priceCurrency: PEN`, availability real, `shippingDetails` hacia PE, `hasMerchantReturnPolicy`) |
| PDP con reseñas reales | `AggregateRating` + `Review`, **solo si existen reseñas verificadas en la base de datos** |
| PLP / guías | `ItemList` de productos + `BreadcrumbList` |
| FAQ y guías | `FAQPage` con las mismas preguntas visibles en la página |

- Validar con el Rich Results Test y dejar un test automatizado que falle el build si una PDP no trae `Product` + `Offer` válidos.
- **El precio y la disponibilidad del schema deben ser idénticos a lo visible y a lo que se envía a WhatsApp.**

## 6. Fase 3 — Feeds de producto (la palanca principal en shopping con IA)

1. **Feed de Google Merchant Center** (XML o TSV en `/feeds/google.xml`), generado desde Supabase y filtrado por la empresa:
   - id, title, description, link, image_link, availability, price (PEN), brand, gtin/mpn, condition
   - `google_product_category`, `product_type`, `age_group`
   - shipping
   - Actualización automática (cron o revalidación) mínimo diaria.
   - **[[VERIFICAR: disponibilidad de listings gratuitos de Merchant Center para Perú]]**
2. **Feed para ChatGPT Shopping** según la especificación vigente del programa de comerciantes de OpenAI (`chatgpt.com/merchants`). **Antes de construirlo, lee la documentación oficial actual y dime los campos obligatorios.** La spec cambia y no quiero que trabajes de memoria. Reutiliza el mismo generador del feed de Google con un adaptador por formato. El link del producto apunta a la PDP. No activar checkout dentro del chat (cerramos por WhatsApp).
3. Títulos del feed con el patrón: `[Marca] [Producto] – [atributo clave] – [edad] años`. Por ejemplo: "Melissa & Doug Cocina de Madera Chef – 3+ años". Nada de mayúsculas sostenidas ni "OFERTA" en el título.
4. Endpoint de validación interno que liste los productos excluidos del feed y el motivo (sin imagen, sin precio, sin stock, descripción corta).

## 7. Fase 4 — Contenido que los motores de IA citan

Reglas de redacción para todo el contenido nuevo:
- **Respuesta primero:** las primeras 1–2 frases de cada página responden la pregunta directamente.
- Datos concretos y verificables: edades, medidas, materiales, precios, tiempos de entrega reales. Nada de adjetivos vacíos ("increíble", "el mejor").
- Encabezados en forma de pregunta real y párrafos cortos. Tablas para comparar.
- Fecha de actualización visible en guías y FAQ, coherente con `dateModified`.

Páginas a crear (plantillas que se llenan desde la base de datos, con un **texto introductorio único** por página; nada de páginas delgadas y duplicadas):

1. **Guías por edad:** "Juguetes para niños de 3 a 5 años" con una intro de 120–200 palabras sobre qué juguetes son adecuados en esa etapa y por qué, una tabla de recomendados (producto, edad, precio, qué desarrolla) y FAQ.
2. **Guías por presupuesto y ocasión:** "Regalos de Navidad para niños por menos de S/ 100", "Regalos de cumpleaños para niños de 6 años".
3. **Descripciones de producto reescritas** (empezar por el top 50 en ventas): qué es, para qué edad, qué habilidad desarrolla, medidas, material, pilas sí/no, contenido de la caja y advertencias. Mínimo 150 palabras de contenido único. **No copiar textos de fabricante tal cual.**
4. **FAQ general:** envíos (zonas, tiempos, costos), cómo comprar por WhatsApp paso a paso, métodos de pago, cambios y devoluciones, garantía, seguridad de los juguetes, ventas mayoristas **[[si aplica]]**.
5. **"Quiénes somos" con datos de entidad:** razón social, RUC, año de fundación, dirección física, que son importadores directos, marcas que manejan y fotos reales del local. Los motores de IA confían más en entidades que pueden verificar.

Proponme la lista de las 15 primeras páginas con su título y la consulta objetivo **antes de redactarlas**. Las redacto o apruebo yo.

## 8. Fase 5 — Medición

1. **GA4:** crear un grupo de canales "IA" con los referrers `chatgpt.com`, `chat.openai.com`, `perplexity.ai`, `gemini.google.com`, `copilot.microsoft.com`, `claude.ai` y `utm_source=chatgpt.com`. Reportar sesiones y eventos `whatsapp_order` por este canal.
2. **Pre-pedido:** asegurar que el `utm_source` y el referrer de IA queden guardados en `web_preorders`, para atribuir ventas cerradas en WhatsApp a tráfico de IA.
3. **Logs de bots:** registrar (middleware o logs del hosting) las visitas de OAI-SearchBot, ChatGPT-User, Claude-SearchBot, Claude-User, PerplexityBot, Perplexity-User, Googlebot y Bingbot: URL, fecha y status. Una vista simple en el panel admin con visitas por bot y por semana.
4. **Panel de consultas objetivo:** una tabla `geo_queries` con 20–30 consultas (ej. "juguetes didácticos Lima", "regalo niño 5 años menos de 100 soles"). La revisión mensual es **manual** (registrar si la tienda aparece o es citada en cada motor). No automatizar scraping de los motores de IA.

## 9. Opcional / baja prioridad

- `/llms.txt` con un índice de las páginas clave (guías, FAQ, categorías, Quiénes somos). Es barato y no hace daño, pero **no lo vendas como factor de posicionamiento**: no hay evidencia de que mejore las citas. Hazlo al final y en 15 minutos.

## 10. Trabajo fuera del código (lo hace el equipo, no Claude Code)

Entrégame al final una checklist para el cliente:
- Google Business Profile completo y verificado, con fotos, horarios, categoría "Tienda de juguetes" y reseñas pedidas a clientes reales después de cada venta por WhatsApp.
- NAP (nombre, dirección, teléfono) **idéntico** en la web, Google Business Profile, Facebook, Instagram, TikTok y directorios.
- Presencia en sitios que los motores de IA citan: menciones en medios o blogs peruanos de crianza, listas de "dónde comprar juguetes en Lima", hilos de Reddit o foros, y reseñas en plataformas de terceros.
- Ritmo: 2 guías nuevas al mes durante la temporada (octubre–diciembre) y actualización de precios y stock en tiempo real.

## 11. Criterios de aceptación

- [ ] `curl` sin JS a cualquier PDP devuelve nombre, precio en PEN, disponibilidad, descripción completa y JSON-LD `Product` válido.
- [ ] robots.txt permite todos los bots de búsqueda/fetch de IA listados, y el CDN no los bloquea (verificado con requests usando esos user-agents).
- [ ] sitemap.xml con `lastmod` real, declarado en robots.txt y enviado a Google Search Console y Bing Webmaster Tools. IndexNow activo.
- [ ] Feed de Merchant Center sin errores críticos. Feed de ChatGPT generado según la spec oficial vigente (si el programa lo permite para Perú).
- [ ] Precio y stock coinciden en: página visible = schema = feed = mensaje de WhatsApp.
- [ ] 0 `AggregateRating` sin reseñas reales detrás.
- [ ] Top 50 productos con descripción única ≥ 150 palabras y edad, medidas y material completos.
- [ ] 15 guías/FAQ publicadas con respuesta en las primeras frases y `FAQPage` coherente.
- [ ] Canal "IA" visible en GA4 y atribución guardada en el pre-pedido.
- [ ] Panel de visitas de bots de IA funcionando.
- [ ] Lighthouse SEO ≥ 95 en home, PLP y PDP.

## 12. Entrega

Trabaja por fases (0 → 5) y detente al final de cada una. En cada entrega: archivos cambiados, cómo verificarlo (comandos `curl` incluidos), migraciones aplicadas y pendientes. Ante cualquier spec externa (OpenAI, Google, IndexNow), **consulta la documentación oficial actual** y cita la URL antes de implementar.
