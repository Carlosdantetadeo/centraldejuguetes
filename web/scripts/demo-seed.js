// Productos de DEMOSTRACIÓN para la vista previa local (dev.db).
// No afecta producción: en Supabase van los productos reales.
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

function slugify(text) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

const DATA = {
  zarandas: [
    { name: "Zaranda metálica 1/4\"", measure: "1.00 x 2.00 m", gauge: '1/4"', price: 85, featured: true },
    { name: "Zaranda metálica 3/8\"", measure: "1.00 x 2.00 m", gauge: '3/8"', price: 90 },
    { name: "Zaranda metálica 1/2\"", measure: "1.00 x 2.00 m", gauge: '1/2"', price: 95 },
    { name: "Zaranda metálica 3/4\"", measure: "1.00 x 2.00 m", gauge: '3/4"', price: 105 },
    { name: "Zaranda para arena fina", measure: "1.20 x 2.40 m", gauge: '1/8"', price: 120 },
  ],
  mallas: [
    { name: "Malla olímpica galvanizada", measure: "2.00 m alto", gauge: "2\"", price: 38, featured: true },
    { name: "Malla raschel 80%", measure: "4.20 x 100 m", gauge: "80%", price: 320 },
    { name: "Malla mosquitero", measure: "1.50 m ancho", gauge: "18x16", price: 12 },
    { name: "Malla ganadera", measure: "1.20 m alto", gauge: "15/150", price: 220 },
  ],
  plastico: [
    { name: "Plástico agrícola negro", measure: "4 m x rollo", gauge: "0.8 mm", price: 180, featured: true },
    { name: "Plástico para invernadero", measure: "6 m ancho", gauge: "200 micras", price: 260 },
    { name: "Geomembrana HDPE", measure: "7 m ancho", gauge: "1.0 mm", price: 14 },
    { name: "Manguera de polietileno", measure: "16 mm", gauge: "clase 5", price: 2 },
  ],
  grass: [
    { name: "Grass sintético deportivo", measure: "2 x rollo", gauge: "50 mm", price: 55, featured: true },
    { name: "Grass sintético decorativo", measure: "2 x rollo", gauge: "20 mm", price: 38 },
    { name: "Grass sintético premium", measure: "2 x rollo", gauge: "40 mm", price: 48 },
  ],
};

(async () => {
  let created = 0;
  for (const [slug, items] of Object.entries(DATA)) {
    const category = await prisma.category.findUnique({ where: { slug } });
    if (!category) {
      console.log(`(!) Categoría no encontrada: ${slug}`);
      continue;
    }
    for (const item of items) {
      const productSlug = slugify(item.name);
      const exists = await prisma.product.findFirst({
        where: { categoryId: category.id, slug: productSlug },
      });
      if (exists) continue;
      await prisma.product.create({
        data: {
          name: item.name,
          slug: productSlug,
          measure: item.measure ?? null,
          gauge: item.gauge ?? null,
          price: item.price,
          stock: 10,
          available: true,
          featured: Boolean(item.featured),
          categoryId: category.id,
        },
      });
      created++;
    }
  }
  console.log(`Productos demo creados: ${created}`);
  await prisma.$disconnect();
})().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
