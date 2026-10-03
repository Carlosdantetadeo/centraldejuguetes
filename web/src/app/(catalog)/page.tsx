import { GenderBand } from "@/components/catalog/GenderBand";
import { ProductCard } from "@/components/catalog/ProductCard";
import {
  FilterSidebar,
  type FilterCounts,
  type CategoryOption,
} from "@/components/catalog/FilterSidebar";
import { getGenderNav, getStorefrontProducts } from "@/lib/catalog";
import { getSiteSettings } from "@/lib/settings";

export const revalidate = 60;

const PRICE_RANGES = [
  { value: "0-50", min: 0, max: 50 },
  { value: "50-200", min: 50, max: 200 },
  { value: "200-500", min: 200, max: 500 },
  { value: "500-99999", min: 500, max: 99999 },
] as const;

type PageProps = {
  searchParams: Promise<{
    categoria?: string;
    disponible?: string;
    precio?: string;
    foto?: string;
  }>;
};

export default async function HomePage({ searchParams }: PageProps) {
  const filters = await searchParams;
  const [allProducts, settings, genderRaw] = await Promise.all([
    getStorefrontProducts(),
    getSiteSettings(),
    getGenderNav(),
  ]);
  const genders = genderRaw.map((g) => ({
    name: g.name,
    slug: g.slug,
    imageUrl: g.imageUrl,
    total: g._count.products + g.children.reduce((sum, c) => sum + c._count.products, 0),
  }));

  const categoryMap = new Map<string, CategoryOption>();
  for (const p of allProducts) {
    const slug = p.category.slug;
    if (!categoryMap.has(slug)) {
      categoryMap.set(slug, { name: p.category.name, slug, count: 0, imageUrl: p.category.imageUrl });
    }
    categoryMap.get(slug)!.count++;
  }
  const categoryOptions = [...categoryMap.values()].sort(
    (a, b) => b.count - a.count,
  );

  const byCategory = filters.categoria
    ? allProducts.filter((p) => p.category.slug === filters.categoria)
    : allProducts;

  const counts: FilterCounts = {
    total: byCategory.length,
    disponible: byCategory.filter((p) => p.available).length,
    conFoto: byCategory.filter((p) => p.images.length > 0).length,
    prices: Object.fromEntries(
      PRICE_RANGES.map(({ value, min, max }) => [
        value,
        byCategory.filter((p) => p.price >= min && p.price < max).length,
      ]),
    ),
  };

  let filtered = byCategory;
  if (filters.disponible === "1") {
    filtered = filtered.filter((p) => p.available);
  }
  if (filters.precio) {
    const range = PRICE_RANGES.find((r) => r.value === filters.precio);
    if (range) {
      filtered = filtered.filter(
        (p) => p.price >= range.min && p.price < range.max,
      );
    }
  }
  if (filters.foto === "1") {
    filtered = filtered.filter((p) => p.images.length > 0);
  }

  const hasActiveFilters =
    filters.categoria || filters.disponible || filters.precio || filters.foto;

  return (
    <>
      {/* Hero banner */}
      <section className={`relative overflow-hidden ${settings.heroImageUrl ? "bg-steel-900" : "bg-brand-600"}`}>
        {settings.heroImageUrl ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={settings.heroImageUrl}
              alt=""
              aria-hidden="true"
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div
              className="absolute inset-0 bg-gradient-to-t from-steel-900 via-steel-900/85 to-steel-900/60"
              aria-hidden="true"
            />
          </>
        ) : (
          <div
            className="pointer-events-none absolute left-1/2 top-[-20%] h-[500px] w-[900px] max-w-full -translate-x-1/2 rounded-full bg-white/10 blur-[140px]"
            aria-hidden="true"
          />
        )}

        <div className="relative mx-auto max-w-3xl px-4 py-16 text-center sm:py-24">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-xs font-medium text-white/90">
            Mayorista de juguetes · Importación directa
          </span>

          <h1 className="mt-6 font-display text-4xl font-extrabold leading-[1.05] tracking-tight text-white sm:text-6xl">
            {settings.siteName}
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-white/75 sm:text-lg">
            {settings.siteDescription}
          </p>

          <div className="mt-9 flex justify-center">
            <a
              href="#productos"
              className={`inline-flex items-center gap-2 rounded-xl px-7 py-3.5 text-sm font-semibold shadow-lg transition-all hover:shadow-xl ${
                settings.heroImageUrl
                  ? "bg-brand-600 text-white shadow-brand-600/30 hover:bg-brand-500"
                  : "bg-white text-brand-700 shadow-white/20 hover:bg-brand-50"
              }`}
            >
              Ver catálogo
              <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current stroke-2" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
              </svg>
            </a>
          </div>
        </div>
      </section>

      {/* Trust badges strip */}
      <section className="border-b border-steel-100 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-5">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { title: "Importado directo", sub: "Juguetes con respaldo de fábrica" },
              { title: "Precios mayoristas", sub: "Por unidad y por docena" },
              { title: "+150 modelos", sub: "Catálogo actualizado permanentemente" },
              { title: "Respuesta rápida", sub: "Cotizaciones vía WhatsApp" },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                  <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-2" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-steel-900">{item.title}</p>
                  <p className="truncate text-xs text-steel-500">{item.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Banda principal por género */}
      <GenderBand genders={genders} />

      {/* Productos + sidebar */}
      <section id="productos" className="mx-auto max-w-6xl px-4 py-10 scroll-mt-20">
        {allProducts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-steel-300 bg-white p-12 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-steel-100">
              <svg viewBox="0 0 24 24" className="h-8 w-8 fill-none stroke-steel-400 stroke-2" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.5a2.25 2.25 0 0 1-2.245 2.25H6.62a2.25 2.25 0 0 1-2.245-2.25L3.75 7.5M10 11.25h4M3.75 7.5h16.5" />
              </svg>
            </div>
            <p className="text-lg font-semibold text-steel-700">Aún no hay productos publicados</p>
            <p className="mt-1 text-sm text-steel-500">El administrador puede agregarlos desde el panel.</p>
          </div>
        ) : (
          <div className="flex gap-8">
            <div className="hidden md:block">
              <FilterSidebar counts={counts} categories={categoryOptions} />
            </div>

            <div className="min-w-0 flex-1">
              <div className="md:hidden">
                <FilterSidebar counts={counts} categories={categoryOptions} />
              </div>

              <div className="mb-6 flex items-baseline justify-between border-b border-steel-100 pb-3">
                <h2 className="font-display text-xl font-bold tracking-tight text-steel-900">
                  {filters.categoria
                    ? (categoryOptions.find(
                        (c) => c.slug === filters.categoria,
                      )?.name ?? "Productos")
                    : "Todos los productos"}
                </h2>
                <span className="font-mono text-xs text-steel-500">
                  {filtered.length}{" "}
                  {filtered.length === 1 ? "producto" : "productos"}
                  {hasActiveFilters ? " encontrados" : ""}
                </span>
              </div>

              {filtered.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-steel-200 bg-white p-12 text-center">
                  <p className="text-steel-500">Ningún producto coincide con los filtros aplicados.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
      </section>
    </>
  );
}
