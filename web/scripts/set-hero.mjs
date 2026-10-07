// Sube el banner de portada (central_juguetes_portada_v3.png) al bucket de
// Supabase y actualiza SiteSettings.heroImageUrl.
//
//   node --env-file=.env scripts/set-hero.mjs

import fs from "node:fs";
import { PrismaClient } from "@prisma/client";

const HERO_PATH = "C:\\Users\\berna\\OneDrive\\Escritorio\\PROYECTOS\\JUGUETES\\central_juguetes_portada_v3.png";

const prisma = new PrismaClient();
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET = process.env.SUPABASE_STORAGE_BUCKET ?? "product-images";

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
  if (!res.ok) throw new Error(`Error subiendo ${objectKey}: ${res.status} ${await res.text().catch(() => "")}`);
  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${objectKey}`;
}

async function main() {
  const buffer = fs.readFileSync(HERO_PATH);
  const heroImageUrl = await uploadToBucket(`branding/hero-${Date.now()}.png`, buffer, "image/png");
  console.log("Banner subido:", heroImageUrl);

  await prisma.siteSettings.update({
    where: { id: "default" },
    data: { heroImageUrl },
  });
  console.log("SiteSettings actualizado: heroImageUrl.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
