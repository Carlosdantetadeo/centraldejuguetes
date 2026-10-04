# GEO — Propuesta de páginas citables (Fase 4)

> Entregable que pide `prompt-geo-tienda-juguetes.md` §7 antes de redactar nada: lista de las 15 primeras páginas con título y consulta objetivo. Esta es una **plantilla de la estructura**, no contenido final — los títulos entre `[[...]]` y las franjas de edad/presupuesto deben ajustarse a los datos reales del cliente que adopte esta instancia (no se fabrican acá). El contenido real (textos de 120–200 palabras, tablas de recomendados, respuestas de FAQ) lo redacta o aprueba el cliente, como pide el prompt.

| # | Tipo | Título propuesto | Consulta objetivo (ejemplo) | Estado |
|---|---|---|---|---|
| 1 | FAQ general | Preguntas frecuentes | "cómo comprar en [[sitio]] por WhatsApp" | ✅ Infra lista (`/preguntas-frecuentes`, admin en `/admin/faq`) — falta contenido real |
| 2 | Quiénes somos | Quiénes somos | "[[sitio]] es importador directo de juguetes" | ⏳ Requiere datos reales de entidad (RUC, año, dirección) — no construido aún |
| 3 | Guía por edad | Juguetes para bebés de 0 a 2 años | "qué juguete regalar a un bebé de 1 año" | ✅ Dato disponible (`ageMin`/`ageMax`) — falta redactar intro + aprobar |
| 4 | Guía por edad | Juguetes para niños de 3 a 5 años | "juguetes educativos para niños de 3 años" | ✅ Mismo caso |
| 5 | Guía por edad | Juguetes para niños de 6 a 8 años | "regalo para niño de 7 años" | ✅ Mismo caso |
| 6 | Guía por edad | Juguetes para niños de 9 a 12 años | "juguetes para preadolescentes" | ✅ Mismo caso |
| 7 | Guía por edad | Juguetes para adolescentes (13+) | "regalos para adolescentes" | ✅ Mismo caso |
| 8 | Guía por presupuesto | Regalos de juguetes por menos de S/ 50 | "regalo barato para niño" | ✅ Dato disponible (`price`) — falta redactar intro + aprobar |
| 9 | Guía por presupuesto | Regalos de juguetes de S/ 50 a S/ 100 | "juguetes entre 50 y 100 soles" | ✅ Mismo caso |
| 10 | Guía por presupuesto | Regalos de juguetes de S/ 100 a S/ 200 | "juguete de calidad por 150 soles" | ✅ Mismo caso |
| 11 | Guía por ocasión | Regalos de Navidad para niños | "qué regalar en Navidad a un niño" | ✅ Dato disponible (fecha límite vendría de `Campaign`, aún no migrado) |
| 12 | Guía por ocasión | Regalos de cumpleaños por edad | "ideas de regalo de cumpleaños para niños" | ✅ Dato disponible (`ageMin`/`ageMax`) |
| 13 | Guía por tipo de juego | Juguetes didácticos y STEM | "juguetes educativos Montessori" | ✅ Dato disponible (categoría real del catálogo) |
| 14 | Guía por tipo de juego | Juguetes de madera | "juguetes de madera para niños" | ✅ Mismo caso |
| 15 | Guía "no sé qué regalar" | ¿No sabes qué regalar? (quiz) | "ayuda para elegir un regalo de juguete" | ⏳ Requiere el quiz de 3 pasos del prompt de frontend (Fase 1, no construida) |

## Lo que ya es código reutilizable

- Infra de FAQ (#1): modelo `FaqItem`, CRUD admin, página pública, `FAQPage` JSON-LD.
- Filtro por precio (#8–10): ya existe en `FilterSidebar`/home — una guía por presupuesto puede reusar `getStorefrontProducts()` + el mismo rango de precios, solo le falta el texto introductorio y el propio componente de página.
- Filtro por categoría (#13–14): ya existe (`getProductsByCategorySlug`) — una guía "por tipo de juego" es básicamente una categoría con una intro editorial encima.
- ✅ **`ageMin`/`ageMax` en `Product` (resuelto 2026-10-04):** desbloquea #3–7 y #12. Falta: una query `getProductsByAgeRange()` en `catalog.ts` (no construida — todavía no hay página consumidora) y, por supuesto, el texto editorial real.

## Lo que sigue bloqueado y por qué

- **Quiénes somos (#2):** necesita datos reales de entidad legal que no existen en una plantilla neutra.
- **Navidad/campañas (#11):** se beneficia del modelo `Campaign` (pendiente) para la fecha límite, aunque podría lanzarse sin eso usando solo el filtro de precio.
- **Quiz de regalo (#15):** es una feature de frontend completa (prompt-frontend §4.9), no una página de contenido simple.
