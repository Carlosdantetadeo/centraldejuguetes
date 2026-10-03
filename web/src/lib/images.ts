import { getSupabaseAdmin, STORAGE_BUCKET } from "@/lib/supabase";

export type ProcessedImage = {
  pathFull: string;
  pathMedium: string;
  pathThumb: string;
  pathJpegFull: string;
};

/**
 * Sube un buffer al bucket de Supabase y devuelve su URL pública.
 *
 * Usa fetch directo a la REST API de Storage con el binario como Uint8Array.
 * Esto evita un bug donde, en el runtime serverless, el cliente de supabase-js
 * serializa el Buffer como texto UTF-8 y corrompe la imagen.
 *
 * NOTA: este módulo NO importa `sharp` a propósito — así los Server Actions y
 * páginas que solo suben/borran no arrastran el binario nativo al bundle
 * (ver `image-process.ts` para el procesamiento con sharp).
 */
export async function uploadToBucket(
  objectKey: string,
  buffer: Buffer,
  contentType: string,
): Promise<string> {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY.");
  }

  const res = await fetch(
    `${url}/storage/v1/object/${STORAGE_BUCKET}/${objectKey}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        apikey: key,
        "Content-Type": contentType,
        "x-upsert": "true",
      },
      body: new Uint8Array(buffer),
    },
  );

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Error subiendo ${objectKey}: ${res.status} ${detail}`);
  }

  return `${url}/storage/v1/object/public/${STORAGE_BUCKET}/${objectKey}`;
}

/**
 * Sube un asset de branding (logo, favicon, hero, imagen de categoría) tal cual,
 * preservando su formato. No usa sharp.
 */
export async function uploadBrandingAsset(
  buffer: Buffer,
  filenameBase: string,
  contentType: string,
): Promise<string> {
  const ext = contentType.split("/")[1]?.replace("+xml", "") || "png";
  return uploadToBucket(`branding/${filenameBase}.${ext}`, buffer, contentType);
}

/**
 * Borra fotos del bucket. Recibe las URLs públicas guardadas en la BD y
 * extrae la ruta del objeto dentro del bucket para eliminarlo.
 */
export async function deleteImageFiles(paths: string[]): Promise<void> {
  const marker = `/${STORAGE_BUCKET}/`;
  const keys = paths
    .map((url) => {
      const index = url.indexOf(marker);
      return index === -1 ? null : url.slice(index + marker.length);
    })
    .filter((key): key is string => Boolean(key));

  if (keys.length === 0) return;

  const { error } = await getSupabaseAdmin()
    .storage.from(STORAGE_BUCKET)
    .remove(keys);

  if (error) {
    console.warn(`No se pudieron borrar imágenes del bucket: ${error.message}`);
  }
}
