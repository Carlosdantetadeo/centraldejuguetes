// Herramienta temporal de investigación: fuzzy-match (pg_trgm) entre los
// slugs citados en guias_aeo.json y los productos reales del catálogo,
// quitando primero palabras de relleno genéricas (que diluyen el score de
// similarity cuando el nombre real del producto es mucho más corto).
//
//   node --env-file=.env scripts/match-guias.mjs

import { PrismaClient } from "@prisma/client";
import fs from "node:fs";

const prisma = new PrismaClient();
const guides = JSON.parse(fs.readFileSync("../guias_aeo.json", "utf-8"));

const STOPWORDS = new Set([
  "de", "del", "la", "el", "los", "las", "y", "en", "con", "para", "por", "un", "una",
  "juego", "juegos", "mesa", "cartas", "clasico", "clasica", "clasicos", "clasicas",
  "infantil", "infantiles", "nino", "ninos", "nina", "ninas", "adultos", "adulto",
  "pzas", "piezas", "pza", "edicion", "nueva", "nuevo", "renovada", "renovado",
  "multilenguaje", "espanol", "basico", "basica", "primer", "primera", "mattel", "hasbro",
]);

function normalize(s) {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

function coreQuery(slug) {
  const words = normalize(slug.replace(/-/g, " ")).split(/\s+/).filter((w) => w && !STOPWORDS.has(w));
  return words.join(" ");
}

async function main() {
  const allSlugs = new Set();
  for (const g of guides) for (const s of g.productos_citados || []) allSlugs.add(s);

  const results = {};
  for (const slug of allSlugs) {
    const query = coreQuery(slug);
    const rows = await prisma.$queryRawUnsafe(
      `SELECT p.id, p.name, p.slug, p.available, c.name as cat,
         similarity(p.name, $1) AS score
       FROM "Product" p
       JOIN "Category" c ON p."categoryId" = c.id
       ORDER BY score DESC
       LIMIT 4`,
      query,
    );
    results[slug] = { query, candidates: rows.map((r) => ({
      name: r.name,
      slug: r.slug,
      score: Number(r.score.toFixed(3)),
      available: r.available,
      cat: r.cat,
    })) };
  }

  fs.writeFileSync("../guide-matches-v2.json", JSON.stringify(results, null, 1));
  console.log("done,", allSlugs.size, "slugs processed");
  await prisma.$disconnect();
}
main();
