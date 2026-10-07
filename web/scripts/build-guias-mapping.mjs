// Compila el mapeo final slug-citado -> slug-real-del-catalogo, combinando
// el auto-match (guide-matches-v2.json) con las correcciones manuales
// decididas tras revisar colisiones de línea de producto (base vs
// expansión/edición) y conteos de piezas.
//
//   node scripts/build-guias-mapping.mjs

import fs from "node:fs";

const auto = JSON.parse(fs.readFileSync("../guide-matches-v2.json", "utf-8"));

// slug citado -> slug real correcto (anula el top-match automático)
const OVERRIDES = {
  "catan-juego-de-mesa-en-espanol-devir": "devir-juego-de-mesa-catan-espanol-8436017220100",
  "king-of-tokyo-nueva-edicion-en-espanol-devir": "devir-king-of-tokyo-new-edition-spanish-8436017223897",
  "codigo-secreto-juego-de-mesa-en-espanol-devir": "devir-juego-de-mesa-codigo-secreto-espanol-8436017223354",
  "fantasma-blitz-juego-de-mesa-multilenguaje-devir": "devir-juego-de-mesa-fantasma-blitz-multilenguaje-8436017220681",
  "monopoly-clasico-edicion-renovada-hasbro": "monopoly-classic-refresh-G0009",
  "rompecabezas-kpop-demon-hunters-500-piezas-clementoni": "clementoni-rompecabezas-x500-piezas-kpop-demon-hunters-compact-box-35625",
  "rompecabezas-peanuts-snoopy-500-piezas-clementoni": "clementoni-rompecabezas-x-500-pzas-peanuts-35806",
  "arqueojugando-triceratops-fosforescente-clementoni": "clementoni-arqueojugando-triceraptops-fosforescente-ciencia-y-juego-55538",
  "carro-de-carrera-para-armar-90-piezas-clementoni": "clementoni-laboratorio-de-mecanica-coche-de-carrera-x-90-piezas-55672",
  "adivina-quien-hasbro-juego-de-mesa-clasico": "juegos-hasbro-juego-de-mesa-adivina-quien-F6105",
  "hipopotamos-glotones-hasbro-juego-clasico": "juegos-hasbro-hippos-glotones-F8815",
  "mi-primer-quien-es-juego-de-mesa-cayro": "cayro-juego-de-mesa-mi-primer-quien-es-849",
  "conecta-4-clasico-hasbro-juego-de-estrategia": "juegos-hasbro-connect-4-refresh-G1500",
  "jenga-clasico-hasbro-juego-de-bloques-de-madera": "juegos-hasbro-jenga-G1499",
  "taboo-juego-de-mesa-de-palabras-hasbro": "juegos-hasbro-juego-de-mesa-taboo-F5254",
  "uno-juego-de-cartas-clasico-mattel": "uno-card-game-W2087",
  "juego-de-la-vida-clasico-game-of-life-hasbro": "juegos-hasbro-game-of-life-classic-F0800",
  "uno-show-em-no-mercy-juego-de-cartas-mattel": "uno-juego-de-cartas-no-mercy-HWV18",
  "diplomacy-juego-de-mesa-en-espanol-devir": "devir-juego-de-mesa-diplomacy-espanol-8436607942726",
  "sagrada-juego-de-dados-y-vitrales-en-espanol-devir": "devir-sagrada-spanish-8436017226546",
  "ubongo-juego-de-mesa-de-rompecabezas-devir": "devir-juego-de-mesa-ubongo-8436017228151",
  "rompecabezas-bluey-60-piezas": "bluey-puzzle-60-piezas-ABP-42690-B",
  "rompecabezas-mona-lisa-leonardo-da-vinci-1000-pzs": "clementoni-rompecabezas-x-1000-pzas-monalisa-37094",
  "rompecabezas-la-gran-ola-de-hokusai-1000-pzs-museum": "clementoni-rompecabezas-x1000-piezas-museum-la-grande-onda-di-hok-39707",
  "8-juegos-en-1-didactico-preescolar-clementoni": "clementoni-8-juegos-en-1-55605",
  "hot-rod-auto-clasico-200-piezas-clementoni": "clementoni-hotrod-auto-clasico-con-mas-de-200-componentes-para-armar-55664",
  "carro-supersonico-320-piezas-clementoni": "clementoni-coche-supersonico-con-mas-de-320-piezas-para-ensamblar-55667",
  "candy-land-hasbro-primer-juego-de-mesa-infantil": "juegos-hasbro-candyland-refresh-G1726",
  "clue-clasico-juego-de-misterio-hasbro": "juegos-hasbro-clue-classic-F6420",
  "gestos-juego-de-mimica-para-fiestas-hasbro": "juegos-hasbro-gestos-refresh-F6421",
};

const mapping = {};
for (const [citedSlug, data] of Object.entries(auto)) {
  const realSlug = OVERRIDES[citedSlug] ?? (data.candidates[0] ? data.candidates[0].slug : null);
  mapping[citedSlug] = realSlug;
}

const unresolved = Object.entries(mapping).filter(([, v]) => !v);
console.log("total:", Object.keys(mapping).length, "| sin resolver:", unresolved.length);
if (unresolved.length) console.log(unresolved.map(([k]) => k));

fs.writeFileSync("../guias-slug-mapping.json", JSON.stringify(mapping, null, 1));
