// Sube el logo horizontal claro (logo_horizontal_claro.png) al bucket de
// Supabase y actualiza SiteSettings.logoUrl.
//
//   node --env-file=.env scripts/set-logo.mjs

import fs from "node:fs";
import { PrismaClient } from "@prisma/client";

const LOGO_PATH = "C:\\Users\\berna\\OneDrive\\Escritorio\\PROYECTOS\\JUGUETES\\logo_horizontal_claro.png";

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
  const buffer = fs.readFileSync(LOGO_PATH);
  const logoUrl = await uploadToBucket(`branding/logo-${Date.now()}.png`, buffer, "image/png");
  console.log("Logo subido:", logoUrl);

  await prisma.siteSettings.update({
    where: { id: "default" },
    data: { logoUrl },
  });
  console.log("SiteSettings actualizado: logoUrl.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
