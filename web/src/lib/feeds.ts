import type { SiteSettings } from "@prisma/client";
import { getSiteUrl } from "@/lib/utils";
import { getProductUrl } from "@/lib/whatsapp";

export type FeedProduct = {
  id: string;
  name: string;
  sku: string | null;
  slug: string;
  description: string | null;
  brand: string | null;
  price: number;
  stock: number;
  available: boolean;
  images: { pathFull: string }[];
  category: { name: string; slug: string };
};

const MIN_DESCRIPTION_LENGTH = 20;

function productUrl(p: FeedProduct): string {
  return getProductUrl(p.category.slug, p.slug);
}

function xmlEscape(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function availability(p: FeedProduct): "in_stock" | "out_of_stock" {
  return p.available && p.stock > 0 ? "in_stock" : "out_of_stock";
}

function hasBrand(p: FeedProduct): boolean {
  return Boolean(p.brand?.trim());
}

export type FeedExclusion = {
  productId: string;
  name: string;
  reasons: string[];
};

// Requisitos mínimos compartidos por ambos feeds, más los específicos de
// cada uno. Devuelve, por producto, el motivo exacto de exclusión (o
// ninguno si califica) — esto es lo que pide la sección 6.4 del prompt GEO.
export function evaluateProductForFeeds(p: FeedProduct): {
  google: string[];
  openai: string[];
} {
  const google: string[] = [];
  const openai: string[] = [];

  if (p.images.length === 0) {
    google.push("sin imagen");
    openai.push("sin imagen");
  }
  if (p.price <= 0) {
    google.push("sin precio");
    openai.push("sin precio");
  }
  if (!p.description || p.description.trim().length < MIN_DESCRIPTION_LENGTH) {
    google.push(`descripción muy corta (mínimo ${MIN_DESCRIPTION_LENGTH} caracteres)`);
    openai.push(`descripción muy corta (mínimo ${MIN_DESCRIPTION_LENGTH} caracteres)`);
  }
  // `brand` es requerido por la spec de OpenAI sin excepción; Google lo
  // tolera si se declara `identifier_exists=no` (ver buildGoogleFeedXml).
  if (!hasBrand(p)) {
    openai.push("sin marca (brand)");
  }

  return { google, openai };
}

export function listFeedExclusions(products: FeedProduct[]): {
  google: FeedExclusion[];
  openai: FeedExclusion[];
} {
  const google: FeedExclusion[] = [];
  const openai: FeedExclusion[] = [];
  for (const p of products) {
    const { google: gReasons, openai: oReasons } = evaluateProductForFeeds(p);
    if (gReasons.length) google.push({ productId: p.id, name: p.name, reasons: gReasons });
    if (oReasons.length) openai.push({ productId: p.id, name: p.name, reasons: oReasons });
  }
  return { google, openai };
}

// --- Google Merchant Center (RSS 2.0 + namespace g:) ---
// https://support.google.com/merchants/answer/7052112
export function buildGoogleFeedXml(
  products: FeedProduct[],
  settings: SiteSettings,
): string {
  const siteUrl = getSiteUrl();
  const items = products
    .filter((p) => evaluateProductForFeeds(p).google.length === 0)
    .map((p) => {
      const url = productUrl(p);
      const title = `${p.name}${p.category.name ? ` – ${p.category.name}` : ""}`;
      return `  <item>
    <g:id>${xmlEscape(p.sku ?? p.id)}</g:id>
    <title>${xmlEscape(title)}</title>
    <description>${xmlEscape(p.description ?? p.name)}</description>
    <link>${xmlEscape(url)}</link>
    <g:image_link>${xmlEscape(p.images[0].pathFull)}</g:image_link>
    <g:availability>${availability(p)}</g:availability>
    <g:price>${p.price.toFixed(2)} ${settings.currency}</g:price>
    <g:condition>new</g:condition>
    ${hasBrand(p) ? `<g:brand>${xmlEscape(p.brand!.trim())}</g:brand>\n    ` : ""}<g:identifier_exists>no</g:identifier_exists>
  </item>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
<channel>
  <title>${xmlEscape(settings.siteName)}</title>
  <link>${xmlEscape(siteUrl)}</link>
  <description>${xmlEscape(settings.siteDescription)}</description>
${items}
</channel>
</rss>
`;
}

// --- ChatGPT Shopping (JSONL) ---
// https://developers.openai.com/commerce/specs/file-upload/products
// (consultado 2026-10-04; formato soportado: JSONL/CSV/TSV, no XML/RSS)
export function buildOpenAiFeedJsonl(
  products: FeedProduct[],
  settings: SiteSettings,
): string {
  return products
    .filter((p) => evaluateProductForFeeds(p).openai.length === 0)
    .map((p) =>
      JSON.stringify({
        item_id: p.sku ?? p.id,
        title: p.name.slice(0, 150),
        description: (p.description ?? p.name).slice(0, 5000),
        url: productUrl(p),
        brand: p.brand!.trim(),
        image_url: p.images[0].pathFull,
        price: `${p.price.toFixed(2)} ${settings.currency}`,
        availability: availability(p),
        seller_name: settings.siteName,
      }),
    )
    .join("\n");
}
