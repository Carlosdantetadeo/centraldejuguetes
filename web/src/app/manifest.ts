import type { MetadataRoute } from "next";
import { getSiteSettings } from "@/lib/settings";

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const s = await getSiteSettings();
  const short = s.siteName.split(" ")[0] ?? s.siteName;

  return {
    name: s.siteName,
    short_name: short,
    description: s.siteDescription ?? s.siteName,
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#ffffff",
    theme_color: s.brandColor ?? "#d40000",
    // El ícono de la PWA/home-screen debe ser cuadrado — el logo horizontal
    // (logoUrl) se vería recortado/estirado. Usa el favicon cuadrado.
    icons: s.faviconUrl
      ? [{ src: s.faviconUrl, sizes: "512x512", type: "image/png", purpose: "any" as const }]
      : [],
  };
}
