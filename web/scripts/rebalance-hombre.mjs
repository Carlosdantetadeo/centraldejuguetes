// Reparte (idempotente) las zapatillas de Hombre entre sus 4 subcategorías
// por modelo (round-robin), usando 4 updateMany en vez de N updates.
//   node --env-file=.env scripts/rebalance-hombre.mjs
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const subs = await prisma.category.findMany({
    where: { parent: { slug: "hombre" } },
    orderBy: { sortOrder: "asc" },
  });
  const hombre = await prisma.category.findUnique({ where: { slug: "hombre" } });
  const catIds = [hombre.id, ...subs.map((s) => s.id)];

  const products = await prisma.product.findMany({
    where: { categoryId: { in: catIds } },
    select: { id: true, name: true, categoryId: true, images: { select: { pathThumb: true }, take: 1, orderBy: { sortOrder: "asc" } } },
  });
  const modeloOf = (name) => name.replace(/^Zapatilla\s+/i, "").split("-M")[0].trim();
  const modelos = [...new Set(products.map((p) => modeloOf(p.name)))].sort();
  const subOfModelo = new Map();
  modelos.forEach((m, i) => subOfModelo.set(m, subs[i % subs.length]));

  const byTarget = new Map(subs.map((s) => [s.id, []]));
  const thumbOf = {};
  for (const p of products) {
    const t = subOfModelo.get(modeloOf(p.name));
    byTarget.get(t.id).push(p.id);
    if (!thumbOf[t.id] && p.images[0]) thumbOf[t.id] = p.images[0].pathThumb;
  }

  for (const s of subs) {
    const ids = byTarget.get(s.id);
    const r = await prisma.product.updateMany({ where: { id: { in: ids } }, data: { categoryId: s.id } });
    if (thumbOf[s.id]) await prisma.category.update({ where: { id: s.id }, data: { imageUrl: thumbOf[s.id] } });
    console.log(`${s.name}: ${ids.length} productos (actualizados ${r.count})`);
  }
  const anyThumb = Object.values(thumbOf)[0];
  if (anyThumb) await prisma.category.update({ where: { id: hombre.id }, data: { imageUrl: anyThumb } });
  console.log("OK");
}
main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
