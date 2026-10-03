// Importa el catálogo de zapatillas (SALIDA_catalogo_punto.xlsx + imágenes)
// a la BD de producción (Supabase Postgres) y sube las fotos al bucket.
//
//   node --env-file=.env scripts/import-catalogo.mjs
//
// Estructura creada:
//   Hombre / Mujer / Niño  (raíces)
//     └─ Urbanas · Outdoor · Running  (subcategorías de cada raíz)
// Todos los productos del Excel son de varón → van bajo Hombre, repartidos por
// MODELO (round-robin) entre las 3 subcategorías (no hay clasificación en la
// fuente; el admin puede recategorizar desde el panel).

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { PrismaClient } from "@prisma/client";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const prisma = new PrismaClient();

const IMG_DIR = path.join(__dirname, "_import_imgs");
const DATA = JSON.parse(fs.readFileSync(path.join(__dirname, "_catalogo.json"), "utf-8"));

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET = process.env.SUPABASE_STORAGE_BUCKET ?? "product-images";
if (!SUPABASE_URL || !SUPABASE_KEY) throw new Error("Faltan SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY");

// ---------- helpers ----------
function slugify(text) {
  return String(text)
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
function parsePrice(s) {
  if (s == null) return 0;
  const n = Number(String(s).replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

async function uploadToBucket(objectKey, buffer, contentType) {
  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${objectKey}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${SUPABASE_KEY}`,
      apikey: SUPABASE_KEY,
      "Content-Type": contentType,
      "x-upsert": "true",
    },
    body: new Uint8Array(buffer),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Error subiendo ${objectKey}: ${res.status} ${detail}`);
  }
  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${objectKey}`;
}

async function compressToTarget(pipeline, maxBytes) {
  let quality = 82;
  let buffer = await pipeline.webp({ quality }).toBuffer();
  while (buffer.length > maxBytes && quality > 40) {
    quality -= 8;
    buffer = await pipeline.webp({ quality }).toBuffer();
  }
  return buffer;
}

async function processProductImage(buffer, filenameBase) {
  const image = sharp(buffer).rotate();
  const metadata = await image.metadata();
  const resize = (maxSide) => {
    if (!metadata.width || !metadata.height) return image.clone();
    const largest = Math.max(metadata.width, metadata.height);
    if (largest <= maxSide) return image.clone();
    return image.clone().resize({
      width: metadata.width >= metadata.height ? maxSide : undefined,
      height: metadata.height > metadata.width ? maxSide : undefined,
      fit: "inside",
      withoutEnlargement: true,
    });
  };
  const fullBuffer = await compressToTarget(resize(1600), 200 * 1024);
  const mediumBuffer = await compressToTarget(resize(900), 100 * 1024);
  const thumbBuffer = await compressToTarget(resize(400), 40 * 1024);
  const jpegBuffer = await resize(1600).jpeg({ quality: 82, mozjpeg: true }).toBuffer();
  const [pathFull, pathMedium, pathThumb, pathJpegFull] = await Promise.all([
    uploadToBucket(`${filenameBase}-full.webp`, fullBuffer, "image/webp"),
    uploadToBucket(`${filenameBase}-medium.webp`, mediumBuffer, "image/webp"),
    uploadToBucket(`${filenameBase}-thumb.webp`, thumbBuffer, "image/webp"),
    uploadToBucket(`${filenameBase}-full.jpg`, jpegBuffer, "image/jpeg"),
  ]);
  return { pathFull, pathMedium, pathThumb, pathJpegFull };
}

async function upsertCategory({ name, slug, parentId = null, sortOrder = 0, description = null }) {
  const existing = await prisma.category.findUnique({ where: { slug } });
  if (existing) return existing;
  return prisma.category.create({ data: { name, slug, parentId, sortOrder, description } });
}

// ---------- main ----------
const SUBS = ["Urbanas", "Outdoor", "Running"];

async function main() {
  // 1) Árbol de categorías: 3 raíces × 3 subcategorías
  const roots = {};
  const subByKey = {}; // `${rootSlug}:${subIndex}` -> category
  const rootDefs = [
    { name: "Hombre", slug: "hombre" },
    { name: "Mujer", slug: "mujer" },
    { name: "Niño", slug: "nino" },
  ];
  for (let ri = 0; ri < rootDefs.length; ri++) {
    const root = await upsertCategory({ ...rootDefs[ri], sortOrder: ri });
    roots[rootDefs[ri].slug] = root;
    for (let si = 0; si < SUBS.length; si++) {
      const sub = await upsertCategory({
        name: SUBS[si],
        slug: `${rootDefs[ri].slug}-${slugify(SUBS[si])}`,
        parentId: root.id,
        sortOrder: si,
      });
      subByKey[`${rootDefs[ri].slug}:${si}`] = sub;
    }
  }
  console.log("Categorías listas (Hombre/Mujer/Niño × Urbanas/Outdoor/Running).");

  // 2) Reparto por MODELO round-robin entre las 3 subcategorías de Hombre
  const modelos = [...new Set(DATA.map((d) => d.modelo))].sort();
  const modeloSub = new Map();
  modelos.forEach((m, i) => modeloSub.set(m, subByKey[`hombre:${i % 3}`]));

  // 3) Productos
  const firstThumbBySub = {}; // category.id -> primer thumb (para imageUrl de categoría)
  const seenModel = new Set();
  let created = 0, skipped = 0, failed = 0;

  const tasks = DATA.map((row, idx) => ({ row, idx }));
  const CONCURRENCY = 5;

  async function worker() {
    while (tasks.length) {
      const { row, idx } = tasks.shift();
      const category = modeloSub.get(row.modelo);
      const name = `Zapatilla ${row.codigo}`;
      const slug = slugify(name);
      try {
        const exists = await prisma.product.findFirst({
          where: { categoryId: category.id, slug },
        });
        if (exists) { skipped++; continue; }

        const buffer = fs.readFileSync(path.join(IMG_DIR, row.imagen));
        const processed = await processProductImage(buffer, `catalogo/${slug}`);

        const tiers = [];
        const mayor = parsePrice(row.pmayor);
        const x6 = parsePrice(row.px6);
        const x24 = parsePrice(row.px24);
        if (mayor) tiers.push({ label: "Precio mayorista", amount: mayor });
        if (x6) tiers.push({ label: "x6 pares", amount: x6 });
        if (x24) tiers.push({ label: "x24 pares", amount: x24 });

        const isFirstOfModel = !seenModel.has(row.modelo);
        seenModel.add(row.modelo);

        await prisma.product.create({
          data: {
            name,
            slug,
            description: `Zapatilla modelo ${row.modelo}. Tallas disponibles: ${row.tallas}.`,
            measure: `Tallas ${row.tallas}`,
            price: parsePrice(row.psug) || mayor,
            priceTiers: tiers.length ? tiers : undefined,
            stock: 10,
            available: true,
            featured: isFirstOfModel,
            categoryId: category.id,
            images: {
              create: { altText: name, sortOrder: 0, ...processed },
            },
          },
        });
        if (!firstThumbBySub[category.id]) firstThumbBySub[category.id] = processed.pathThumb;
        created++;
        if (created % 20 === 0) console.log(`  ...${created} creados`);
      } catch (err) {
        failed++;
        console.warn(`  (x) ${row.codigo}: ${err.message}`);
      }
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, worker));

  // 4) Imagen representativa por categoría (subcategorías + raíz Hombre)
  for (const [catId, thumb] of Object.entries(firstThumbBySub)) {
    await prisma.category.update({ where: { id: catId }, data: { imageUrl: thumb } }).catch(() => {});
  }
  const anyThumb = Object.values(firstThumbBySub)[0];
  if (anyThumb) {
    await prisma.category.update({ where: { id: roots.hombre.id }, data: { imageUrl: anyThumb } }).catch(() => {});
  }

  console.log(`\nHecho. Creados: ${created} · Omitidos (ya existían): ${skipped} · Fallidos: ${failed}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
