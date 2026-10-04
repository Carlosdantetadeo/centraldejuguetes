import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductCard } from "@/components/catalog/ProductCard";
import { FilterSidebar, type FilterCounts } from "@/components/catalog/FilterSidebar";
import { getProductsByCategorySlug } from "@/lib/catalog";
import { getSiteSettings } from "@/lib/settings";
import { JsonLd } from "@/components/JsonLd";
import { buildBreadcrumbJsonLd, buildItemListJsonLd } from "@/lib/jsonld";
import { getSiteUrl } from "@/lib/utils";

export const revalidate = 60;

const PRICE_RANGES = [
  { value: "0-50", min: 0, max: 50 },
  { value: "50-200", min: 50, max: 200 },
  { value: "200-500", min: 200, max: 500 },
  { value: "500-99999", min: 500, max: 99999 },
] as const;

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{
    disponible?: string;
    precio?: string;
    foto?: string;
  }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const [{ category }, settings] = await Promise.all([
    getProductsByCategorySlug(slug),
    getSiteSettings(),
  ]);
  if (!category) return { title: "Categoría no encontrada" };

  return {
    title: category.name,
    description:
      category.description ??
      `Productos de ${category.name} en ${settings.siteName}. Cotiza por WhatsApp.`,
    openGraph: {
      title: category.name,
      description: category.description ?? undefined,
    },
  };
}

export default async function CategoryPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const filters = await searchParams;
  const { category, products } = await getProductsByCategorySlug(slug);

  if (!category) notFound();

  // Counts para el sidebar (sobre todos los productos, sin filtrar)
  const counts: FilterCounts = {
    total: products.length,
    disponible: products.filter((p) => p.available).length,
    conFoto: products.filter((p) => p.images.length > 0).length,
    prices: Object.fromEntries(
      PRICE_RANGES.map(({ value, min, max }) => [
        value,
        products.filter((p) => p.price >= min && p.price < max).length,
      ]),
    ),
  };

  // Aplicar filtros
  let filtered = products;
  if (filters.disponible === "1") {
    filtered = filtered.filter((p) => p.available);
  }
  if (filters.precio) {
    const range = PRICE_RANGES.find((r) => r.value === filters.precio);
    if (range) {
      filtered = filtered.filter((p) => p.price >= range.min && p.price < range.max);
    }
  }
  if (filters.foto === "1") {
    filtered = filtered.filter((p) => p.images.length > 0);
  }

  const hasActiveFilters = filters.disponible || filters.precio || filters.foto;

  const siteUrl = getSiteUrl();
  const breadcrumbItems = [
    { name: "Inicio", url: siteUrl },
    { name: category.name, url: `${siteUrl}/categoria/${category.slug}` },
  ];
  const itemListItems = filtered.map((p) => ({
    name: p.name,
    url: `${siteUrl}/producto/${category.slug}/${p.slug}`,
  }));

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <JsonLd data={buildBreadcrumbJsonLd(breadcrumbItems)} />
      {itemListItems.length > 0 && (
        <JsonLd data={buildItemListJsonLd(itemListItems)} />
      )}

      {/* Breadcrumb */}
      <nav className="mb-4 flex items-center gap-2 text-sm text-steel-500">
        <a href="/" className="hover:text-brand-700 transition-colors">Inicio</a>
        <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current stroke-1.5" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
        </svg>
        <span className="font-medium text-steel-800">{category.name}</span>
      </nav>

      {/* Encabezado */}
      <div className="mb-8 rounded-2xl bg-gradient-to-br from-steel-50 to-white border border-steel-100 p-6">
        <p className="text-xs font-semibold text-brand-600">
          Categoría
        </p>
        <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-steel-900 sm:text-3xl">
          {category.name}
        </h1>
        {category.description && (
          <p className="mt-2 max-w-2xl text-sm leading-6 text-steel-500">{category.description}</p>
        )}
        <p className="mt-3 font-mono text-xs text-steel-400">
          {products.length} {products.length === 1 ? "producto" : "productos"} en esta categoría
        </p>
      </div>

      {products.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-steel-300 bg-white p-12 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-steel-100">
            <svg viewBox="0 0 24 24" className="h-8 w-8 fill-none stroke-steel-400 stroke-2" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.5a2.25 2.25 0 0 1-2.245 2.25H6.62a2.25 2.25 0 0 1-2.245-2.25L3.75 7.5M10 11.25h4M3.75 7.5h16.5" />
            </svg>
          </div>
          <p className="text-lg font-semibold text-steel-700">No hay productos en esta categoría todavía</p>
        </div>
      ) : (
        <div className="md:flex md:gap-8">
          {/* Sidebar de filtros */}
          <FilterSidebar counts={counts} />

          {/* Productos */}
          <div className="min-w-0 flex-1">
            {/* Barra de resultados */}
            <div className="mb-5 flex items-center justify-between border-b border-steel-100 pb-3">
              <p className="font-mono text-xs text-steel-500">
                {filtered.length}{" "}
                {filtered.length === 1 ? "producto" : "productos"}
                {hasActiveFilters ? " encontrados" : ""}
              </p>
            </div>

            {filtered.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-steel-200 bg-white p-12 text-center">
                <p className="text-steel-500">Ningún producto coincide con los filtros aplicados.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filtered.map((product) => (
                  <ProductCard
                    key={product.id}
                    id={product.id}
                    name={product.name}
                    sku={product.sku}
                    slug={product.slug}
                    categoryName={product.category.name}
                    measure={product.measure}
                    gauge={product.gauge}
                    price={product.price}
                    available={product.available}
                    categorySlug={product.category.slug}
                    image={product.images[0]}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
