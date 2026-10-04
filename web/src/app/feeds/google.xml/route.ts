import { getAllProductsForFeeds } from "@/lib/catalog";
import { buildGoogleFeedXml } from "@/lib/feeds";
import { getSiteSettings } from "@/lib/settings";

export const revalidate = 3600; // 1h — GEO fase 3 pide mínimo diario, esto es más seguido

export async function GET() {
  const [products, settings] = await Promise.all([
    getAllProductsForFeeds(),
    getSiteSettings(),
  ]);

  return new Response(buildGoogleFeedXml(products, settings), {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
}
