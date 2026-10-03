/**
 * Seed del catálogo de juguetes.
 * Crea las 7 categorías y todos sus productos.
 * Ejecutar: npx tsx prisma/seed-catalog.ts
 * (Requiere que la DB ya esté migrada y la tabla Product exista.)
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function toTitleCase(str: string): string {
  return str
    .toLowerCase()
    .replace(/(?:^|\s|-)\S/g, (c) => c.toUpperCase());
}

type ProductDef = { name: string; sort: number };

type CategoryDef = {
  name: string;
  slug: string;
  sortOrder: number;
  products: ProductDef[];
};

const CATALOG: CategoryDef[] = [
  {
    name: "Niños",
    slug: "ninos",
    sortOrder: 1,
    products: [
      { name: "Det de Pista de Carros", sort: 1 },
      { name: "Set de Pista de Carros", sort: 2 },
      { name: "Dron a Control", sort: 5 },
      { name: "Bowlin con Plataforma", sort: 6 },
      { name: "Robot a Control", sort: 8 },
      { name: "Armables Robot", sort: 9 },
      { name: "Set de Carritos", sort: 10 },
      { name: "Set de Camiones", sort: 11 },
      { name: "Dron Avión a Control", sort: 12 },
      { name: "Carro Fórmula a Control", sort: 13 },
      { name: "Piano Órgano", sort: 14 },
      { name: "Mesita de Bloques", sort: 15 },
      { name: "Robot Solar 14 en 1", sort: 17 },
      { name: "Carro a Control Remoto y Guante", sort: 19 },
      { name: "Robot Armable a Batería de 250 Pzas", sort: 20 },
      { name: "Robot Armable a Batería de 180 Pzas", sort: 21 },
      { name: "Motocarga con Luz y Sonido", sort: 22 },
      { name: "Tren Musical y Encaje", sort: 23 },
      { name: "Set de Mecano Armable", sort: 24 },
    ],
  },
  {
    name: "Niñas",
    slug: "ninas",
    sortOrder: 2,
    products: [
      { name: "Piano Electrónico", sort: 1 },
      { name: "Cocina Musical", sort: 2 },
      { name: "Set de Batidora", sort: 3 },
      { name: "Refrigeradora con Accesorios", sort: 4 },
      { name: "Set de Alimentos", sort: 5 },
      { name: "Set de Mariscos en Bolsa", sort: 6 },
      { name: "Set de Cocina", sort: 7 },
      { name: "Set de Microondas", sort: 8 },
      { name: "Cocina Armable", sort: 9 },
      { name: "Mini Cocina Stand Pollo Frito", sort: 10 },
      { name: "Mini Cocina Stand", sort: 11 },
      { name: "Set de Cuentas de Niña", sort: 12 },
      { name: "Set de Cuentas para Niña", sort: 13 },
      { name: "Set de Cuentas para Niñas", sort: 16 },
      { name: "Set de Cuentas", sort: 17 },
      { name: "Set de Limpieza", sort: 18 },
      { name: "Bañera con Muñeca", sort: 19 },
      { name: "Cocina a Pila", sort: 20 },
      { name: "Licuadora a Pila", sort: 21 },
      { name: "Mochila con Mascota", sort: 22 },
      { name: "Set de Alimentos en Canasta", sort: 23 },
      { name: "Frutas y Verduras en Bandeja", sort: 24 },
    ],
  },
  {
    name: "Bebés",
    slug: "bebes",
    sortOrder: 3,
    products: [
      { name: "Guitarra Elefante", sort: 1 },
      { name: "Set de Mordedor Flor", sort: 2 },
      { name: "Set de Mordedor Átomo", sort: 3 },
      { name: "Tobogán con Circuito", sort: 4 },
      { name: "Tobogán con Encaje Dino", sort: 6 },
      { name: "Tobogán con Encaje Pez", sort: 7 },
      { name: "Arco de Fútbol Dinosaurio", sort: 8 },
      { name: "Arco de Fútbol Elefante", sort: 9 },
      { name: "Tablero Didáctico con Animalitos", sort: 10 },
      { name: "Vaquita Musical", sort: 11 },
      { name: "Tobogán León", sort: 12 },
      { name: "Caballito Xilófono", sort: 13 },
      { name: "Gimnasio con Piano", sort: 14 },
      { name: "Cubo Multifuncional", sort: 15 },
      { name: "Cubi Didáctico Multifuncional", sort: 16 },
      { name: "Arco Astronauta Musical", sort: 17 },
      { name: "Pelotas con Texturas x6", sort: 18 },
      { name: "Bolsa Didáctica Musical", sort: 19 },
      { name: "Tren con Vagones Didáctico", sort: 21 },
      { name: "Cocodrilo Martillo", sort: 22 },
      { name: "Mesita Multifuncional", sort: 23 },
    ],
  },
  {
    name: "Didácticos",
    slug: "didacticos",
    sortOrder: 4,
    products: [
      { name: "Cubos Imantados de 108 Pzas", sort: 1 },
      { name: "Cubos Imantados de 160 Pzas", sort: 2 },
      { name: "Cubo Memaminx", sort: 3 },
      { name: "Bloques de 44 Pzas en Bolsa", sort: 4 },
      { name: "Pleygo en Bolsa", sort: 5 },
      { name: "Cubo Mágico Imantado", sort: 6 },
      { name: "Frutas y Verduras para Desconchar", sort: 7 },
      { name: "Bloques Imantados de 54 Pzas", sort: 8 },
      { name: "Bloques Imantados de 50 Pzas", sort: 9 },
      { name: "Máquina Registradora", sort: 10 },
      { name: "Bloques para Armar de 120 Pzas", sort: 11 },
      { name: "Bloques para Armar", sort: 12 },
      { name: "Perro Dentista", sort: 13 },
      { name: "Imantado de 43 Pzas", sort: 14 },
      { name: "Juego Microscopio", sort: 15 },
      { name: "Tachito de Basura con Carita", sort: 16 },
      { name: "Trensito con Candados", sort: 17 },
      { name: "Muelita con Accesorios", sort: 18 },
      { name: "Animalito Musical", sort: 19 },
      { name: "Set de Dentista en Caja", sort: 20 },
      { name: "Set de Dentista en Bolsa", sort: 21 },
      { name: "Juego de Microscopio", sort: 22 },
      { name: "Bloques Imantados de 36 Pzas", sort: 23 },
      { name: "Arena Mágica", sort: 24 },
    ],
  },
  {
    name: "Mesa",
    slug: "mesa",
    sortOrder: 5,
    products: [
      { name: "Ajedrez 5 en 1", sort: 1 },
      { name: "Ajedrez 4 en 1", sort: 2 },
      { name: "Ajedrez 3 en 1 Grande", sort: 4 },
      { name: "Ajedrez 3 en 1", sort: 5 },
      { name: "Ajedrez Azul 3 en 1", sort: 7 },
      { name: "Juego Bingo", sort: 8 },
      { name: "Fulbito de Mesa", sort: 9 },
      { name: "Juego Educativo", sort: 10 },
      { name: "Lotto Memoria", sort: 12 },
      { name: "Juego Basta", sort: 13 },
      { name: "Póker en Lata Grande", sort: 14 },
      { name: "Ajedrez de Madera Mediano", sort: 15 },
      { name: "Bingo Azul", sort: 16 },
      { name: "Bingo Neo Rojo", sort: 17 },
      { name: "Bingo Celeste Caja Grande", sort: 18 },
      { name: "Juego de Mesa Michi", sort: 19 },
      { name: "Bingo Familiar", sort: 20 },
      { name: "Juego Discos Magnéticos", sort: 21 },
      { name: "Juego de Cubos con Timbre", sort: 22 },
      { name: "Juego de Cuerdas", sort: 23 },
      { name: "Juego de Pesca", sort: 24 },
    ],
  },
  {
    name: "Madera",
    slug: "madera",
    sortOrder: 6,
    products: [
      { name: "Cocina de Madera", sort: 1 },
      { name: "Pandereta de Madera", sort: 2 },
      { name: "Michi de Madera Grande", sort: 3 },
      { name: "Circuito de Madera", sort: 4 },
      { name: "Pizarra de Madera y Plástico", sort: 5 },
      { name: "Plantado x3 de Madera", sort: 6 },
      { name: "Plantado x4 de Madera", sort: 7 },
      { name: "Pizarra Doble de Madera", sort: 8 },
      { name: "Rompecabeza Abecedario", sort: 9 },
      { name: "Tablero Montessori 6 en 1", sort: 10 },
      { name: "Carro Bombero de Madera", sort: 11 },
      { name: "Cubo Soma de Madera", sort: 12 },
      { name: "Tablero Montessori", sort: 13 },
      { name: "Tablero Montessori de Madera", sort: 14 },
      { name: "Cubo 8 en 1 de Madera", sort: 15 },
      { name: "Tren Imantado de Madera", sort: 16 },
      { name: "Rompecabeza Animalitos", sort: 17 },
      { name: "Carro Clavijero de Madera", sort: 18 },
      { name: "Rompecabeza de Abecedario", sort: 19 },
      { name: "Pizarra Magnética de Madera", sort: 20 },
      { name: "Tambor de Madera", sort: 21 },
      { name: "Maracas de Madera Grande", sort: 22 },
      { name: "Circuito de Madera Chico", sort: 23 },
      { name: "Tren de Madera", sort: 24 },
    ],
  },
  {
    name: "Animal",
    slug: "animal",
    sortOrder: 7,
    products: [
      { name: "Animales Marinos en Bolsa", sort: 1 },
      { name: "Aves x8 en Bolsa", sort: 2 },
      { name: "Animales de Granja", sort: 3 },
      { name: "Perros en Bolsa", sort: 4 },
      { name: "Animal Granja Suave", sort: 5 },
      { name: "Dinosaurio x4 de Colores", sort: 6 },
      { name: "Animal Marino", sort: 7 },
      { name: "Animal Reptil", sort: 8 },
      { name: "Animalitos de Jebe", sort: 9 },
      { name: "Insectos de Jebe", sort: 10 },
      { name: "Animal Insecto en Bolsa", sort: 11 },
      { name: "Dinosaurio Suave de Jebe", sort: 12 },
      { name: "Kin Kon de Jebe", sort: 13 },
      { name: "Dinosaurio", sort: 14 },
      { name: "Dinosaurio x4 Unidades", sort: 15 },
      { name: "Insectos", sort: 16 },
      { name: "Animales Marinos", sort: 17 },
      { name: "Insectos con Mariquita", sort: 18 },
      { name: "Animales Narinos", sort: 19 },
      { name: "Perro", sort: 20 },
      { name: "Perro - Modelo 2", sort: 21 },
      { name: "Perro - Modelo 3", sort: 22 },
    ],
  },
];

async function main() {
  console.log("Iniciando seed del catálogo de juguetes...\n");

  for (const catDef of CATALOG) {
    const category = await prisma.category.upsert({
      where: { slug: catDef.slug },
      update: { name: catDef.name, sortOrder: catDef.sortOrder },
      create: {
        name: catDef.name,
        slug: catDef.slug,
        sortOrder: catDef.sortOrder,
      },
    });

    console.log(`Categoría: ${category.name} (${category.id})`);

    const usedSlugs = new Set<string>();

    for (const prod of catDef.products) {
      let slug = slugify(prod.name);

      // Garantiza slug único dentro de la categoría
      if (usedSlugs.has(slug)) {
        let i = 2;
        while (usedSlugs.has(`${slug}-${i}`)) i++;
        slug = `${slug}-${i}`;
      }
      usedSlugs.add(slug);

      await prisma.product.upsert({
        where: { categoryId_slug: { categoryId: category.id, slug } },
        update: { name: prod.name },
        create: {
          name: prod.name,
          slug,
          price: 0,
          stock: 1,
          available: true,
          featured: false,
          categoryId: category.id,
        },
      });

      console.log(`  · ${prod.sort.toString().padStart(2, "0")} ${prod.name}`);
    }
  }

  console.log("\nSeed completado.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
