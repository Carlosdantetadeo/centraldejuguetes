// Aplica el mapeo slug-citado -> slug-real (guias-slug-mapping.json) sobre
// el contenido original de las guías, y descarta los bloques `jsonld`
// (se regeneran en runtime con el dominio real — ver src/lib/jsonld.ts).
// Resultado: src/content/guias-aeo.json, lo que consume la app.
//
//   node scripts/transform-guias.mjs

import fs from "node:fs";

const guides = JSON.parse(fs.readFileSync("../guias_aeo.json", "utf-8"));
const mapping = JSON.parse(fs.readFileSync("../guias-slug-mapping.json", "utf-8"));

function remap(slug) {
  const real = mapping[slug];
  if (!real) throw new Error(`Sin mapeo para slug citado: ${slug}`);
  return real;
}

const transformed = guides.map((g) => {
  const tabla = g.tabla
    ? {
        ...g.tabla,
        filas: g.tabla.filas.map((fila) =>
          fila.map((cell) =>
            cell && typeof cell === "object" && "slug" in cell
              ? { ...cell, slug: remap(cell.slug) }
              : cell,
          ),
        ),
      }
    : undefined;

  const secciones = g.secciones.map((s) => ({
    ...s,
    productos: (s.productos || []).map(remap),
  }));

  const productos_citados = [...new Set((g.productos_citados || []).map(remap))];

  const { jsonld: _jsonld, ...rest } = g;
  return { ...rest, tabla, secciones, productos_citados };
});

fs.mkdirSync("src/content", { recursive: true });
fs.writeFileSync("src/content/guias-aeo.json", JSON.stringify(transformed, null, 2));
console.log("ok:", transformed.length, "guías transformadas ->", "src/content/guias-aeo.json");
