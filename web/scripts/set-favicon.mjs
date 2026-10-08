// Sube el favicon (favicon-central.png, el hexágono recortado del logo) al
// bucket de Supabase y actualiza SiteSettings.faviconUrl.
//
//   node --env-file=.env scripts/set-favicon.mjs

import fs from "node:fs";
import { PrismaClient } from "@prisma/client";

const FAVICON_PATH = "C:\\Users\\berna\\OneDrive\\Escritorio\\PROYECTOS\\JUGUETES\\favicon-central.png";

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
  const buffer = fs.readFileSync(FAVICON_PATH);
  const faviconUrl = await uploadToBucket(`branding/favicon-${Date.now()}.png`, buffer, "image/png");
  console.log("Favicon subido:", faviconUrl);

  await prisma.siteSettings.update({
    where: { id: "default" },
    data: { faviconUrl },
  });
  console.log("SiteSettings actualizado: faviconUrl.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
