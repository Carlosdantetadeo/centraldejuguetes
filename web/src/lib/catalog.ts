import { prisma } from "@/lib/db";
import { normalizeSearch } from "@/lib/utils";

export const productInclude = {
  category: true,
  images: {
    orderBy: { sortOrder: "asc" as const },
  },
};

export async function getRootCategories() {
  // Regla 0: no publicar categorías vacías. Una raíz se muestra si tiene
  // productos propios O si alguna de sus subcategorías tiene productos.
  return prisma.category.findMany({
    where: {
      parentId: null,
      OR: [
        { products: { some: {} } },
        { children: { some: { products: { some: {} } } } },
      ],
    },
    orderBy: { sortOrder: "asc" },
    include: {
      _count: { select: { products: true } },
    },
  });
}

// Navegación principal: todas las categorías raíz con sus subcategorías y
// conteo de productos propios + hijos. Sirve al Header, MobileMenu y GenderBand.
export async function getGenderNav() {
  return prisma.category.findMany({
    where: { parentId: null },
    orderBy: { sortOrder: "asc" },
    include: {
      _count: { select: { products: true } },
      children: {
        orderBy: { sortOrder: "asc" },
        include: { _count: { select: { products: true } } },
      },
    },
  });
}

export async function getCategoryBySlug(slug: string) {
  return prisma.category.findUnique({
    where: { slug },
    include: {
      children: { orderBy: { sortOrder: "asc" } },
    },
  });
}

export async function getStorefrontProducts() {
  // Grilla principal tipo tienda: primero los que tienen foto, luego
  // disponibles, destacados y por nombre.
  return prisma.product.findMany({
    orderBy: [
      { images: { _count: "desc" } },
      { available: "desc" },
      { featured: "desc" },
      { name: "asc" },
    ],
    include: productInclude,
  });
}

// "Más vendidos" (prompt-frontend §4.6): máximo 8, nunca productos sin stock.
export async function getFeaturedProducts(limit = 8) {
  return prisma.product.findMany({
    where: { featured: true, available: true, stock: { gt: 0 } },
    take: limit,
    orderBy: { updatedAt: "desc" },
    include: productInclude,
  });
}

export async function getProductsByCategorySlug(slug: string) {
  const category = await getCategoryBySlug(slug);
  if (!category) return { category: null, products: [] };

  const categoryIds = [category.id, ...category.children.map((child) => child.id)];

  const products = await prisma.product.findMany({
    where: { categoryId: { in: categoryIds } },
    orderBy: [{ images: { _count: "desc" } }, { available: "desc" }, { name: "asc" }],
    include: productInclude,
  });

  return { category, products };
}

// Productos relacionados (prompt-frontend §6): misma edad y rango de
// precio. Si el producto no tiene edad configurada, cae a "misma
// categoría + precio similar" para no dejar la sección vacía.
export async function getRelatedProducts(
  product: { id: string; price: number; ageMin: number | null; ageMax: number | null; categoryId: string },
  limit = 4,
) {
  const priceMin = product.price * 0.5;
  const priceMax = product.price * 1.5;
  return prisma.product.findMany({
    where: {
      id: { not: product.id },
      available: true,
      stock: { gt: 0 },
      price: { gte: priceMin, lte: priceMax },
      ...(product.ageMin != null && product.ageMax != null
        ? { ageMin: { lte: product.ageMax }, ageMax: { gte: product.ageMin } }
        : { categoryId: product.categoryId }),
    },
    take: limit,
    include: productInclude,
  });
}

export async function getProductBySlugs(categorySlug: string, productSlug: string) {
  const category = await getCategoryBySlug(categorySlug);
  if (!category) return null;

  return prisma.product.findFirst({
    where: {
      slug: productSlug,
      categoryId: category.id,
    },
    include: productInclude,
  });
}

export async function searchProducts(query: string) {
  const normalized = normalizeSearch(query);
  if (!normalized) return [];

  // pg_trgm similarity() contra campos concatenados — umbral 0.08 para
  // tolerar typos y búsquedas parciales (ej. "malla olimp" → "Malla Olímpica").
  type ScoredRow = { id: string; score: number };
  const scored = await prisma.$queryRaw<ScoredRow[]>`
    SELECT p.id,
      similarity(
        concat_ws(' ', p.name, p.description, p.measure, p.gauge, p.material, c.name),
        ${normalized}
      ) AS score
    FROM "Product" p
    JOIN "Category" c ON p."categoryId" = c.id
    WHERE similarity(
        concat_ws(' ', p.name, p.description, p.measure, p.gauge, p.material, c.name),
        ${normalized}
      ) > 0.08
    ORDER BY score DESC, p.name ASC
    LIMIT 50
  `;

  if (scored.length === 0) return [];

  const products = await prisma.product.findMany({
    where: { id: { in: scored.map((r) => r.id) } },
    include: productInclude,
  });

  // Restaura el orden por score de similaridad
  const scoreMap = new Map(scored.map((r) => [r.id, Number(r.score)]));
  return products.sort((a, b) => (scoreMap.get(b.id) ?? 0) - (scoreMap.get(a.id) ?? 0));
}

export async function getAllProductsForSitemap() {
  return prisma.product.findMany({
    select: {
      slug: true,
      updatedAt: true,
      category: { select: { slug: true } },
    },
  });
}

export async function getAllCategoriesForSitemap() {
  return prisma.category.findMany({
    select: { slug: true, updatedAt: true },
  });
}

// Fuente única para los feeds de producto (Google Merchant / ChatGPT
// Shopping — GEO fase 3). Trae todo lo que los builders necesitan evaluar.
export async function getAllProductsForFeeds() {
  return prisma.product.findMany({
    select: {
      id: true,
      name: true,
      sku: true,
      slug: true,
      description: true,
      brand: true,
      price: true,
      stock: true,
      available: true,
      images: { orderBy: { sortOrder: "asc" }, select: { pathFull: true } },
      category: { select: { name: true, slug: true } },
    },
  });
}

export async function getAdminStats() {
  const [products, categories, outOfStock, featured] = await Promise.all([
    prisma.product.count(),
    prisma.category.count(),
    prisma.product.count({ where: { available: false } }),
    prisma.product.count({ where: { featured: true } }),
  ]);

  return { products, categories, outOfStock, featured };
}

export async function getTopViewedProducts(limit = 10) {
  // US-14: productos más consultados, ordenados por contador de vistas.
  return prisma.product.findMany({
    where: { vistas: { gt: 0 } },
    take: limit,
    orderBy: [{ vistas: "desc" }, { name: "asc" }],
    include: { category: true },
  });
}

export async function getAllProductsAdmin() {
  return prisma.product.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      category: true,
      images: { orderBy: { sortOrder: "asc" }, take: 1 },
    },
  });
}

export async function getProductById(id: string) {
  return prisma.product.findUnique({
    where: { id },
    include: productInclude,
  });
}

// La campaña vigente "ahora": activa y dentro de su rango de fechas. Si
// hay más de una superpuesta, gana la más reciente (startsAt desc).
export async function getActiveCampaign() {
  const now = new Date();
  return prisma.campaign.findFirst({
    where: { active: true, startsAt: { lte: now }, endsAt: { gte: now } },
    orderBy: { startsAt: "desc" },
  });
}

export async function getAllCampaignsAdmin() {
  return prisma.campaign.findMany({ orderBy: { startsAt: "desc" } });
}

type BotWeekRow = { botName: string; week: Date; count: bigint };

// GEO fase 5 §3: visitas por bot y por semana, últimos 90 días.
export async function getBotVisitStats() {
  const rows = await prisma.$queryRaw<BotWeekRow[]>`
    SELECT "botName", date_trunc('week', "createdAt") AS week, count(*) AS count
    FROM "BotVisit"
    WHERE "createdAt" > now() - interval '90 days'
    GROUP BY "botName", week
    ORDER BY week DESC, "botName" ASC
  `;
  return rows.map((r) => ({ ...r, count: Number(r.count) }));
}

export async function getAllGeoQueriesAdmin() {
  return prisma.geoQuery.findMany({ orderBy: { createdAt: "asc" } });
}

export async function getPublishedTestimonials() {
  return prisma.testimonial.findMany({
    where: { published: true },
    orderBy: { sortOrder: "asc" },
  });
}

export async function getAllTestimonialsAdmin() {
  return prisma.testimonial.findMany({ orderBy: { sortOrder: "asc" } });
}

export async function getFaqItems() {
  return prisma.faqItem.findMany({ orderBy: { sortOrder: "asc" } });
}

export async function getAllCategoriesAdmin() {
  return prisma.category.findMany({
    orderBy: [{ parentId: "asc" }, { sortOrder: "asc" }],
    include: {
      parent: true,
      _count: { select: { products: true, children: true } },
    },
  });
}
