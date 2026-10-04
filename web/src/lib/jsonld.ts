import type { SiteSettings } from "@prisma/client";
import { getSiteUrl } from "@/lib/utils";

type BreadcrumbItem = { name: string; url: string };
type ListItem = { name: string; url: string };

export function buildOrganizationJsonLd(settings: SiteSettings) {
  const siteUrl = getSiteUrl();
  const sameAs = [
    settings.socialFacebook,
    settings.socialInstagram,
    settings.socialTiktok,
  ].filter((v): v is string => Boolean(v));

  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: settings.siteName,
    url: siteUrl,
    ...(settings.logoUrl ? { logo: settings.logoUrl } : {}),
    ...(sameAs.length ? { sameAs } : {}),
    ...(settings.whatsappNumber
      ? {
          contactPoint: [
            {
              "@type": "ContactPoint",
              telephone: `+${settings.whatsappNumber}`,
              contactType: "sales",
              availableLanguage: settings.locale,
            },
          ],
        }
      : {}),
  };
}

export function buildWebSiteJsonLd(settings: SiteSettings) {
  const siteUrl = getSiteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: settings.siteName,
    url: siteUrl,
    potentialAction: {
      "@type": "SearchAction",
      target: `${siteUrl}/buscar?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}

// Store (subtipo de LocalBusiness). Solo incluye lo que SiteSettings
// realmente tiene configurado — nada de horarios/geo inventados.
export function buildStoreJsonLd(settings: SiteSettings) {
  const siteUrl = getSiteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "Store",
    name: settings.siteName,
    url: siteUrl,
    ...(settings.address ? { address: settings.address } : {}),
    ...(settings.phone ? { telephone: settings.phone } : {}),
    ...(settings.country ? { areaServed: settings.country } : {}),
  };
}

export function buildBreadcrumbJsonLd(items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function buildItemListJsonLd(items: ListItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      url: item.url,
    })),
  };
}

type ProductForJsonLd = {
  name: string;
  description?: string | null;
  sku?: string | null;
  price: number;
  available: boolean;
  images: { pathFull: string; altText: string }[];
  url: string;
};

// Product + Offer. Sin audience/gtin/returnPolicy/AggregateRating: esos
// campos no existen todavía en el schema ni hay reseñas reales (prohibido
// inventarlos — ver prompt-geo-tienda-juguetes.md §1).
export function buildProductJsonLd(
  product: ProductForJsonLd,
  settings: SiteSettings,
) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    ...(product.description ? { description: product.description } : {}),
    ...(product.sku ? { sku: product.sku } : {}),
    image: product.images.map((img) => img.pathFull),
    url: product.url,
    offers: {
      "@type": "Offer",
      price: product.price.toFixed(2),
      priceCurrency: settings.currency,
      availability: product.available
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      url: product.url,
    },
  };
}
