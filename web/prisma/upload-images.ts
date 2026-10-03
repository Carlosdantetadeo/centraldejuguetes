/**
 * Carga masiva de imágenes de juguetes → Supabase Storage + DB.
 * Lee los .jpg de imagenes_villar/, los procesa con sharp (4 variantes WebP/JPEG)
 * y crea los registros ProductImage en la DB.
 *
 * Ejecutar desde web/:  npx tsx prisma/upload-images.ts
 * Es idempotente: salta productos que ya tienen imágenes.
 */
import { PrismaClient } from "@prisma/client";
import sharp, { type Sharp } from "sharp";
import fs from "node:fs";
import path from "node:path";

const prisma = new PrismaClient();

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const BUCKET       = process.env.SUPABASE_STORAGE_BUCKET ?? "product-images";

// Ruta a la carpeta con imágenes (relativa al script → web/prisma/ → ../../imagenes_villar)
const IMAGES_ROOT = path.join(__dirname, "..", "..", "imagenes_villar");

// Carpeta en disco → slug de categoría en la DB
const FOLDER_MAP: Record<string, string> = {
  "NIÑOS":                   "ninos",
  "JUGUETE NIÑAS":           "ninas",
  "TODO BEBES":              "bebes",
  "JUGUETES DIDACTICOS":     "didacticos",
  "JUEGOS DE MESA":          "mesa",
  "DIDÁCTICOS DE MADERITA":  "madera",
  "ANIMALES":                "animal",
};

// Nombres en los archivos que difieren del nombre en la DB (typos / correcciones del seed)
const CORRECTIONS: Record<string, string> = {
  "FRUTAS Y VERDURAS DESCONCHAR":    "FRUTAS Y VERDURAS PARA DESCONCHAR",
  "TREN CON BAGONES DIDACTICO":      "TREN CON VAGONES DIDACTICO",
  "JUEDO DE MICROSCOPIO":            "JUEGO DE MICROSCOPIO",
  "TABLERO MONTESORI 6 EN 1":        "TABLERO MONTESSORI 6 EN 1",
  "TABLERO MONTESORI":               "TABLERO MONTESSORI",
  "TABLERO MONTESORI DE MADERA":     "TABLERO MONTESSORI DE MADERA",
  "DINOSAURIO X 4 UNIDADES":         "DINOSAURIO X4 UNIDADES",
};

// ─── helpers ────────────────────────────────────────────────────────────────

function norm(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toUpperCase()
    .trim();
}

async function uploadBuffer(
  key: string,
  buf: Buffer,
  contentType: string,
): Promise<string> {
  const res = await fetch(
    `${SUPABASE_URL}/storage/v1/object/${BUCKET}/${key}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SERVICE_KEY}`,
        apikey: SERVICE_KEY,
        "Content-Type": contentType,
        "x-upsert": "true",
      },
      body: new Uint8Array(buf),
    },
  );
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Upload ${key}: ${res.status} ${detail}`);
  }
  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${key}`;
}

async function compress(pipeline: Sharp, maxBytes: number): Promise<Buffer> {
  let q = 82;
  let buf = await pipeline.webp({ quality: q }).toBuffer();
  while (buf.length > maxBytes && q > 40) {
    q -= 8;
    buf = await pipeline.webp({ quality: q }).toBuffer();
  }
  return buf;
}

async function processAndUpload(
  imgBuf: Buffer,
  base: string,
): Promise<{ pathFull: string; pathMedium: string; pathThumb: string; pathJpegFull: string }> {
  const img = sharp(imgBuf).rotate();
  const meta = await img.metadata();

  const resize = (maxSide: number) => {
    if (!meta.width || !meta.height) return img.clone();
    if (Math.max(meta.width, meta.height) <= maxSide) return img.clone();
    return img.clone().resize({
      width:  meta.width  >= meta.height ? maxSide : undefined,
      height: meta.height >  meta.width  ? maxSide : undefined,
      fit: "inside",
      withoutEnlargement: true,
    });
  };

  const [full, medium, thumb, jpeg] = await Promise.all([
    compress(resize(1600), 200 * 1024),
    compress(resize(900),  100 * 1024),
    compress(resize(400),   40 * 1024),
    resize(1600).jpeg({ quality: 82, mozjpeg: true }).toBuffer(),
  ]);

  const [pathFull, pathMedium, pathThumb, pathJpegFull] = await Promise.all([
    uploadBuffer(`${base}-full.webp`,   full,   "image/webp"),
    uploadBuffer(`${base}-medium.webp`, medium, "image/webp"),
    uploadBuffer(`${base}-thumb.webp`,  thumb,  "image/webp"),
    uploadBuffer(`${base}-full.jpg`,    jpeg,   "image/jpeg"),
  ]);

  return { pathFull, pathMedium, pathThumb, pathJpegFull };
}

// ─── main ────────────────────────────────────────────────────────────────────

async function main() {
  if (!SUPABASE_URL || !SERVICE_KEY) {
    throw new Error("Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env");
  }

  // Cargar todos los productos agrupados por categoría
  const categories = await prisma.category.findMany({
    include: { products: { include: { images: { select: { id: true } } } } },
  });

  // categorySlug → Map<nombreNormalizado, producto>
  const lookup = new Map<string, Map<string, { id: string; name: string; slug: string }>>();
  for (const cat of categories) {
    const m = new Map<string, { id: string; name: string; slug: string }>();
    for (const p of cat.products) m.set(norm(p.name), p);
    lookup.set(cat.slug, m);
  }

  let uploaded = 0, skipped = 0, unmatched = 0, errors = 0;

  for (const [folder, catSlug] of Object.entries(FOLDER_MAP)) {
    const folderPath = path.join(IMAGES_ROOT, folder);
    const nameMap = lookup.get(catSlug);

    if (!nameMap) { console.log(`⚠  Categoría no encontrada: ${catSlug}`); continue; }

    console.log(`\n📂  ${folder}  →  ${catSlug}`);

    let jpgFiles: string[];
    try {
      jpgFiles = fs.readdirSync(folderPath).filter(f => /\.jpg$/i.test(f));
    } catch {
      console.log(`   ⚠  Carpeta no encontrada: ${folderPath}`);
      continue;
    }

    // Agrupar archivos por nombre de producto normalizado
    const groups = new Map<string, Array<{ code: number; file: string }>>();
    for (const file of jpgFiles) {
      const m = file.match(/^(\d+)_(.+)\.jpg$/i);
      if (!m) continue;
      const code = parseInt(m[1], 10);
      let key = norm(m[2]);
      key = CORRECTIONS[key] ?? key;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push({ code, file });
    }

    for (const [key, images] of groups) {
      const product = nameMap.get(key);
      if (!product) {
        console.log(`   ✗  Sin match: "${key}"`);
        unmatched++;
        continue;
      }

      // Idempotente: saltar si ya tiene imágenes
      const existing = await prisma.productImage.count({ where: { productId: product.id } });
      if (existing > 0) {
        process.stdout.write(`   ⟳  ${product.name}\n`);
        skipped++;
        continue;
      }

      images.sort((a, b) => a.code - b.code);
      process.stdout.write(`   ↑  ${product.name} `);

      let sort = 0;
      for (const { code, file } of images) {
        const buf  = fs.readFileSync(path.join(folderPath, file));
        const base = `products/${catSlug}/${product.slug}/${String(code).padStart(3, "0")}`;
        try {
          const paths = await processAndUpload(buf, base);
          await prisma.productImage.create({
            data: { productId: product.id, altText: product.name, sortOrder: sort, ...paths },
          });
          sort++;
          process.stdout.write("·");
        } catch (err) {
          process.stdout.write("✗");
          console.log(`\n      Error en ${file}: ${err instanceof Error ? err.message : err}`);
          errors++;
        }
      }
      console.log(` (${sort})`);
      uploaded += sort;
    }
  }

  console.log(`\n${"─".repeat(52)}`);
  console.log(`✓  ${uploaded}  imágenes subidas`);
  console.log(`⟳  ${skipped}  productos saltados (ya tenían imágenes)`);
  if (unmatched) console.log(`?  ${unmatched}  archivos sin producto en DB`);
  if (errors)    console.log(`✗  ${errors}  errores de upload`);
}

main()
  .catch(err => { console.error(err); process.exit(1); })
  .finally(() => prisma.$disconnect());
