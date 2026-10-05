import { cache } from "react";
import type { SiteSettings } from "@prisma/client";
import { prisma } from "@/lib/db";

// Valores neutros de respaldo: si la fila singleton aún no existe (instancia
// recién clonada sin seed), el sitio público no debe romperse. Reflejan los
// @default del modelo en schema.prisma.
export const DEFAULT_SETTINGS: SiteSettings = {
  id: "default",
  siteName: "Mi Catálogo",
  siteDescription: "Catálogo de productos con cotización por WhatsApp.",
  announcement: null,
  logoUrl: null,
  heroImageUrl: null,
  faviconUrl: null,
  ogImageUrl: null,
  brandColor: "#64717a",
  brandColorDark: null,
  whatsappNumber: "",
  phone: null,
  address: null,
  socialFacebook: null,
  socialInstagram: null,
  socialTiktok: null,
  footerTagline: null,
  businessHours: null,
  shippingNote: null,
  paymentMethods: null,
  currency: "PEN",
  locale: "es-PE",
  country: "PE",
  priceLabel: "Precio incluye impuestos",
  priceNote: "Precio referencial, cotización final por WhatsApp.",
  legalEntity: null,
  legalText: null,
  updatedAt: new Date(0),
};

// Configuración de la instancia (tabla singleton, id fijo "default").
// `cache()` deduplica la lectura dentro de un mismo request (el layout la usa
// en cada página). La actualización entre requests la maneja el ISR de las
// páginas + revalidatePath tras guardar en /admin/configuracion.
export const getSiteSettings = cache(async (): Promise<SiteSettings> => {
  const settings = await prisma.siteSettings.findUnique({
    where: { id: "default" },
  });
  return settings ?? DEFAULT_SETTINGS;
});
