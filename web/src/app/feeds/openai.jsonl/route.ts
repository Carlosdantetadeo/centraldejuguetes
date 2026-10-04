import { getAllProductsForFeeds } from "@/lib/catalog";
import { buildOpenAiFeedJsonl } from "@/lib/feeds";
import { getSiteSettings } from "@/lib/settings";

export const revalidate = 3600;

export async function GET() {
  const [products, settings] = await Promise.all([
    getAllProductsForFeeds(),
    getSiteSettings(),
  ]);

  return new Response(buildOpenAiFeedJsonl(products, settings), {
    headers: { "Content-Type": "application/x-ndjson; charset=utf-8" },
  });
}
