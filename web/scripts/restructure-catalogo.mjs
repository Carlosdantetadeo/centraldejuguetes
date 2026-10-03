// Reestructura el catálogo:
//  1) Elimina TODO lo que no sea zapatillas (categorías industriales viejas +
//     sus productos + sus fotos en Storage).
//  2) Añade la subcategoría "Training" bajo Hombre / Mujer / Niño.
//  3) Reparte las zapatillas de Hombre entre las 4 subcategorías
//     (Urbanas · Outdoor · Running · Training) por modelo, round-robin.
//
//   node --env-file=.env scripts/restructure-catalogo.mjs

import { PrismaClient } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";

const prisma = new PrismaClient();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET = process.env.SUPABASE_STORAGE_BUCKET ?? "product-images";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } });

function slugify(t) {
  return String(t).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}
function storageKey(url) {
  const marker = `/${BUCKET}/`;
  const i = url.indexOf(marker);
  return i === -1 ? null : url.slice(i + marker.length);
}

const ROOTS = [
  { name: "Hombre", slug: "hombre" },
  { name: "Mujer", slug: "mujer" },
  { name: "Niño", slug: "nino" },
];
const SUBS = ["Urbanas", "Outdoor", "Running", "Training"];

// Slugs que forman parte del árbol de zapatillas (todo lo demás se borra)
const KEEP = new Set([
  ...ROOTS.map((r) => r.slug),
  ...ROOTS.flatMap((r) => SUBS.map((s) => `${r.slug}-${slugify(s)}`)),
]);

async function main() {
  // 1) Borrar lo viejo -------------------------------------------------------
  const oldCats = await prisma.category.findMany({ where: { slug: { notIn: [...KEEP] } } });
  if (oldCats.length) {
    const oldIds = oldCats.map((c) => c.id);
    const imgs = await prisma.productImage.findMany({
      where: { product: { categoryId: { in: oldIds } } },
      select: { pathFull: true, pathMedium: true, pathThumb: true, pathJpegFull: true },
    });
    const keys = imgs.flatMap((r) => [r.pathFull, r.pathMedium, r.pathThumb, r.pathJpegFull])
      .map(storageKey).filter(Boolean);
    if (keys.length) {
      const { error } = await supabase.storage.from(BUCKET).remove(keys);
      if (error) console.warn("Aviso al borrar fotos viejas:", error.message);
    }
    const delProd = await prisma.product.deleteMany({ where: { categoryId: { in: oldIds } } });
    const delCat = await prisma.category.deleteMany({ where: { id: { in: oldIds } } });
    console.log(`Eliminado antiguo → categorías: ${delCat.count}, productos: ${delProd.count}, fotos: ${keys.length}`);
  } else {
    console.log("No había categorías antiguas que eliminar.");
  }

  // 2) Asegurar árbol de zapatillas + subcategoría Training ------------------
  const rootBySlug = {};
  for (let ri = 0; ri < ROOTS.length; ri++) {
    const root = await prisma.category.upsert({
      where: { slug: ROOTS[ri].slug },
      update: { name: ROOTS[ri].name, sortOrder: ri, parentId: null },
      create: { name: ROOTS[ri].name, slug: ROOTS[ri].slug, sortOrder: ri },
    });
    rootBySlug[ROOTS[ri].slug] = root;
    for (let si = 0; si < SUBS.length; si++) {
      await prisma.category.upsert({
        where: { slug: `${ROOTS[ri].slug}-${slugify(SUBS[si])}` },
        update: { name: SUBS[si], sortOrder: si, parentId: root.id },
        create: { name: SUBS[si], slug: `${ROOTS[ri].slug}-${slugify(SUBS[si])}`, parentId: root.id, sortOrder: si },
      });
    }
  }
  const hombreSubs = await prisma.category.findMany({
    where: { parentId: rootBySlug.hombre.id },
    orderBy: { sortOrder: "asc" },
  });
  console.log("Subcategorías de Hombre:", hombreSubs.map((c) => c.name).join(", "));

  // 3) Repartir zapatillas de Hombre por modelo (round-robin sobre 4 subcats) -
  const hombreSubIds = new Set(hombreSubs.map((c) => c.id));
  const products = await prisma.product.findMany({
    where: { OR: [{ categoryId: { in: [...hombreSubIds] } }, { categoryId: rootBySlug.hombre.id }] },
    include: { images: { orderBy: { sortOrder: "asc" }, take: 1 } },
  });
  // modelo = parte antes de "-M" en el nombre "Zapatilla 25434-M3"
  const modeloOf = (p) => p.name.replace(/^Zapatilla\s+/i, "").split("-M")[0].trim();
  const modelos = [...new Set(products.map(modeloOf))].sort();
  const subOfModelo = new Map();
  modelos.forEach((m, i) => subOfModelo.set(m, hombreSubs[i % hombreSubs.length]));

  let moved = 0;
  const firstThumb = {}; // catId -> thumb
  for (const p of products) {
    const target = subOfModelo.get(modeloOf(p));
    if (p.categoryId !== target.id) {
      await prisma.product.update({ where: { id: p.id }, data: { categoryId: target.id } });
      moved++;
    }
    if (!firstThumb[target.id] && p.images[0]) firstThumb[target.id] = p.images[0].pathThumb;
  }
  console.log(`Productos reasignados: ${moved} (total ${products.length}) entre ${hombreSubs.length} subcategorías.`);

  // Imagen representativa por subcategoría + raíz Hombre
  for (const [catId, thumb] of Object.entries(firstThumb)) {
    await prisma.category.update({ where: { id: catId }, data: { imageUrl: thumb } }).catch(() => {});
  }
  const anyThumb = Object.values(firstThumb)[0];
  if (anyThumb) await prisma.category.update({ where: { id: rootBySlug.hombre.id }, data: { imageUrl: anyThumb } }).catch(() => {});

  // Recuento final
  const counts = await prisma.category.findMany({
    where: { parentId: rootBySlug.hombre.id },
    orderBy: { sortOrder: "asc" },
    include: { _count: { select: { products: true } } },
  });
  console.log("\nHombre:");
  counts.forEach((c) => console.log(`  ${c.name}: ${c._count.products}`));
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
