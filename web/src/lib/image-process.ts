import sharp, { type Sharp } from "sharp";
import { type ProcessedImage, uploadToBucket } from "@/lib/images";

// Este módulo SÍ importa sharp (módulo nativo). Solo debe importarse desde el
// código que realmente procesa imágenes (la API route de upload), nunca desde
// Server Actions o páginas — así sharp no se arrastra a esos bundles.

async function compressToTarget(pipeline: Sharp, maxBytes: number): Promise<Buffer> {
  let quality = 82;
  let buffer = await pipeline.webp({ quality }).toBuffer();

  while (buffer.length > maxBytes && quality > 40) {
    quality -= 8;
    buffer = await pipeline.webp({ quality }).toBuffer();
  }

  return buffer;
}

export async function processProductImage(
  buffer: Buffer,
  filenameBase: string,
): Promise<ProcessedImage> {
  const image = sharp(buffer).rotate();
  const metadata = await image.metadata();

  const resize = (maxSide: number) => {
    if (!metadata.width || !metadata.height) return image.clone();
    const largest = Math.max(metadata.width, metadata.height);
    if (largest <= maxSide) return image.clone();
    return image.clone().resize({
      width: metadata.width >= metadata.height ? maxSide : undefined,
      height: metadata.height > metadata.width ? maxSide : undefined,
      fit: "inside",
      withoutEnlargement: true,
    });
  };

  const fullBuffer = await compressToTarget(resize(1600), 200 * 1024);
  const mediumBuffer = await compressToTarget(resize(900), 100 * 1024);
  const thumbBuffer = await compressToTarget(resize(400), 40 * 1024);
  const jpegBuffer = await resize(1600).jpeg({ quality: 82, mozjpeg: true }).toBuffer();

  const [pathFull, pathMedium, pathThumb, pathJpegFull] = await Promise.all([
    uploadToBucket(`${filenameBase}-full.webp`, fullBuffer, "image/webp"),
    uploadToBucket(`${filenameBase}-medium.webp`, mediumBuffer, "image/webp"),
    uploadToBucket(`${filenameBase}-thumb.webp`, thumbBuffer, "image/webp"),
    uploadToBucket(`${filenameBase}-full.jpg`, jpegBuffer, "image/jpeg"),
  ]);

  return { pathFull, pathMedium, pathThumb, pathJpegFull };
}
