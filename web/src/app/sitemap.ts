import { getAllCategoriesForSitemap, getAllProductsForSitemap } from "@/lib/catalog";
import { getAllGuides } from "@/lib/guias";
import { getSiteUrl } from "@/lib/utils";

export default async function sitemap() {
  const siteUrl = getSiteUrl();
  const [categories, products] = await Promise.all([
    getAllCategoriesForSitemap(),
    getAllProductsForSitemap(),
  ]);

  return [
    {
      url: siteUrl,
      lastModified: new Date(),
    },
    {
      url: `${siteUrl}/buscar`,
      lastModified: new Date(),
    },
    {
      url: `${siteUrl}/privacidad`,
      lastModified: new Date(),
    },
    {
      url: `${siteUrl}/preguntas-frecuentes`,
      lastModified: new Date(),
    },
    {
      url: `${siteUrl}/guias`,
      lastModified: new Date(),
    },
    ...getAllGuides().map((guide) => ({
      url: `${siteUrl}/guias/${guide.slug}`,
      lastModified: new Date(),
    })),
    ...categories.map((category) => ({
      url: `${siteUrl}/categoria/${category.slug}`,
      lastModified: category.updatedAt,
    })),
    ...products.map((product) => ({
      url: `${siteUrl}/producto/${product.category.slug}/${product.slug}`,
      lastModified: product.updatedAt,
    })),
  ];
}
