import { GenderBand } from "@/components/catalog/GenderBand";
import { ProductCard } from "@/components/catalog/ProductCard";
import {
  FilterSidebar,
  type FilterCounts,
  type CategoryOption,
  type BrandOption,
} from "@/components/catalog/FilterSidebar";
import { SortSelect } from "@/components/catalog/SortSelect";
import { Pagination } from "@/components/catalog/Pagination";
import {
  getActiveCampaign,
  getFeaturedProducts,
  getGenderNav,
  getPublishedTestimonials,
  getStorefrontProducts,
} from "@/lib/catalog";
import { AGE_RANGES, PAGE_SIZE, PRICE_RANGES } from "@/lib/constants";
import { getSiteSettings } from "@/lib/settings";
import { JsonLd } from "@/components/JsonLd";
import { buildStoreJsonLd } from "@/lib/jsonld";

export const revalidate = 60;

type PageProps = {
  searchParams: Promise<{
    categoria?: string;
    disponible?: string;
    precio?: string;
    edad?: string;
    marca?: string;
    orden?: string;
    pagina?: string;
    foto?: string;
  }>;
};

export default async function HomePage({ searchParams }: PageProps) {
  const filters = await searchParams;
  const [allProducts, settings, genderRaw, campaign, bestSellers, testimonials] = await Promise.all([
    getStorefrontProducts(),
    getSiteSettings(),
    getGenderNav(),
    getActiveCampaign(),
    getFeaturedProducts(8),
    getPublishedTestimonials(),
  ]);

  const hero = {
    imageUrl: campaign?.imageUrl ?? settings.heroImageUrl,
    title: campaign?.title ?? settings.siteName,
    subtitle: campaign?.subtitle ?? settings.siteDescription,
    ctaLabel: campaign?.ctaLabel ?? "Ver catálogo",
    ctaUrl: campaign?.ctaUrl ?? "#productos",
  };
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

  const brandMap = new Map<string, number>();
  for (const p of allProducts) {
    if (!p.brand) continue;
    brandMap.set(p.brand, (brandMap.get(p.brand) ?? 0) + 1);
  }
  const brandOptions: BrandOption[] = [...brandMap.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  const byCategory = filters.categoria
    ? allProducts.filter((p) => p.category.slug === filters.categoria)
    : allProducts;

  const counts: FilterCounts = {
    total: byCategory.length,
    disponible: byCategory.filter((p) => p.available && p.stock > 0).length,
    conFoto: byCategory.filter((p) => p.images.length > 0).length,
    prices: Object.fromEntries(
      PRICE_RANGES.map(({ value, min, max }) => [
        value,
        byCategory.filter((p) => p.price >= min && p.price < max).length,
      ]),
    ),
    ages: Object.fromEntries(
      AGE_RANGES.map((range) => [
        range.value,
        byCategory.filter(
          (p) => p.ageMin != null && p.ageMax != null && p.ageMin <= range.max && p.ageMax >= range.min,
        ).length,
      ]),
    ),
  };

  // "Con stock" es el default (prompt-frontend §5): hay que pedir
  // disponible=0 explícito para ver también los productos sin stock.
  let filtered = byCategory;
  if (filters.disponible !== "0") {
    filtered = filtered.filter((p) => p.available && p.stock > 0);
  }
  if (filters.precio) {
    const range = PRICE_RANGES.find((r) => r.value === filters.precio);
    if (range) {
      filtered = filtered.filter(
        (p) => p.price >= range.min && p.price < range.max,
      );
    }
  }
  if (filters.edad) {
    const range = AGE_RANGES.find((r) => r.value === filters.edad);
    if (range) {
      filtered = filtered.filter(
        (p) => p.ageMin != null && p.ageMax != null && p.ageMin <= range.max && p.ageMax >= range.min,
      );
    }
  }
  if (filters.marca) {
    filtered = filtered.filter((p) => p.brand === filters.marca);
  }
  if (filters.foto === "1") {
    filtered = filtered.filter((p) => p.images.length > 0);
  }

  const hasActiveFilters =
    filters.categoria ||
    filters.disponible === "0" ||
    filters.precio ||
    filters.edad ||
    filters.marca ||
    filters.foto;

  // Orden (prompt-frontend §5): más vendidos (vistas), precio asc/desc,
  // novedades. Sin "orden" se mantiene el orden natural de la query
  // (con foto / disponible / destacado primero).
  const sorted = [...filtered];
  if (filters.orden === "vendidos") sorted.sort((a, b) => b.vistas - a.vistas);
  else if (filters.orden === "precio-asc") sorted.sort((a, b) => a.price - b.price);
  else if (filters.orden === "precio-desc") sorted.sort((a, b) => b.price - a.price);
  else if (filters.orden === "nuevos") sorted.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  // Paginación — URL real (?pagina=N), indexable y compartible.
  const currentPage = Math.max(1, parseInt(filters.pagina ?? "1", 10) || 1);
  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const paginated = sorted.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <>
      <JsonLd data={buildStoreJsonLd(settings)} />

      {/* Hero banner — campaña vigente si hay una, si no el genérico de SiteSettings */}
      <section className={`relative overflow-hidden ${hero.imageUrl ? "bg-steel-900" : "bg-brand-600"}`}>
        {hero.imageUrl ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={hero.imageUrl}
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
            {campaign
              ? `Oferta hasta el ${campaign.endsAt.toLocaleDateString("es-PE")}`
              : "Mayorista de juguetes · Importación directa"}
          </span>

          <h1 className="mt-6 font-display text-4xl font-extrabold leading-[1.05] tracking-tight text-white sm:text-6xl">
            {hero.title}
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-white/75 sm:text-lg">
            {hero.subtitle}
          </p>

          <div className="mt-9 flex justify-center">
            <a
              href={hero.ctaUrl}
              className={`inline-flex items-center gap-2 rounded-xl px-7 py-3.5 text-sm font-semibold shadow-lg transition-all hover:shadow-xl ${
                hero.imageUrl
                  ? "bg-brand-600 text-white shadow-brand-600/30 hover:bg-brand-500"
                  : "bg-white text-brand-700 shadow-white/20 hover:bg-brand-50"
              }`}
            >
              {hero.ctaLabel}
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

      {/* Comprar por edad */}
      <section className="border-b border-steel-100 bg-white py-8">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="mb-4 font-display text-lg font-bold tracking-tight text-steel-900">
            Comprar por edad
          </h2>
          <div className="flex gap-3 overflow-x-auto pb-1 sm:gap-4">
            {AGE_RANGES.map((range) => (
              <a
                key={range.value}
                href={`/?edad=${range.value}#productos`}
                className={`flex shrink-0 flex-col items-center justify-center gap-1.5 rounded-full border px-5 py-5 text-center transition-all hover:-translate-y-0.5 hover:shadow-md sm:px-7 sm:py-6 ${
                  filters.edad === range.value
                    ? "border-brand-500 bg-brand-50 text-brand-700"
                    : "border-steel-200 bg-steel-50 text-steel-700 hover:border-brand-300"
                }`}
              >
                <span className="text-sm font-bold sm:text-base">{range.label}</span>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Comprar por presupuesto */}
      <section className="border-b border-steel-100 bg-steel-50 py-8">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="mb-4 font-display text-lg font-bold tracking-tight text-steel-900">
            Comprar por presupuesto
          </h2>
          <div className="flex flex-wrap gap-3">
            {PRICE_RANGES.map((range) => (
              <a
                key={range.value}
                href={`/?precio=${range.value}#productos`}
                className={`rounded-xl border px-5 py-3 text-sm font-semibold transition-all hover:-translate-y-0.5 hover:shadow-md ${
                  filters.precio === range.value
                    ? "border-brand-500 bg-brand-600 text-white"
                    : "border-steel-200 bg-white text-steel-700 hover:border-brand-300"
                }`}
              >
                {range.label}
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Más vendidos — máximo 8, solo con stock real */}
      {bestSellers.length > 0 && (
        <section className="border-b border-steel-100 bg-white py-10">
          <div className="mx-auto max-w-6xl px-4">
            <h2 className="mb-5 font-display text-lg font-bold tracking-tight text-steel-900">
              Más vendidos
            </h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {bestSellers.map((product) => (
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
                  stock={product.stock}
                  ageMin={product.ageMin}
                  ageMax={product.ageMax}
                  available={product.available}
                  categorySlug={product.category.slug}
                  image={product.images[0]}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Banda principal por tipo de juego (categorías) */}
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
              <FilterSidebar counts={counts} categories={categoryOptions} brands={brandOptions} />
            </div>

            <div className="min-w-0 flex-1">
              <div className="md:hidden">
                <FilterSidebar counts={counts} categories={categoryOptions} brands={brandOptions} />
              </div>

              <div className="mb-6 flex flex-wrap items-baseline justify-between gap-3 border-b border-steel-100 pb-3">
                <h2 className="font-display text-xl font-bold tracking-tight text-steel-900">
                  {filters.categoria
                    ? (categoryOptions.find(
                        (c) => c.slug === filters.categoria,
                      )?.name ?? "Productos")
                    : "Todos los productos"}
                </h2>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs text-steel-500">
                    {sorted.length}{" "}
                    {sorted.length === 1 ? "producto" : "productos"}
                    {hasActiveFilters ? " encontrados" : ""}
                  </span>
                  <SortSelect />
                </div>
              </div>

              {sorted.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-steel-200 bg-white p-12 text-center">
                  <p className="text-steel-500">Ningún producto coincide con los filtros aplicados.</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {paginated.map((product) => (
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
                        stock={product.stock}
                        ageMin={product.ageMin}
                        ageMax={product.ageMax}
                        available={product.available}
                        categorySlug={product.category.slug}
                        image={product.images[0]}
                      />
                    ))}
                  </div>
                  <Pagination currentPage={currentPage} totalPages={totalPages} searchParams={filters} />
                </>
              )}
            </div>
          </div>
        )}
      </section>

      {/* Prueba social — solo testimonios reales publicados desde el panel */}
      {testimonials.length > 0 && (
        <section className="border-t border-steel-100 bg-steel-50 py-12">
          <div className="mx-auto max-w-6xl px-4">
            <h2 className="mb-6 font-display text-xl font-bold tracking-tight text-steel-900">
              Lo que dicen nuestros clientes
            </h2>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {testimonials.map((t) => (
                <figure key={t.id} className="rounded-2xl border border-steel-200 bg-white p-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-steel-200 bg-steel-100">
                      {t.imageUrl ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={t.imageUrl} alt={t.authorName} className="h-full w-full object-cover" />
                      ) : (
                        <span className="text-xs font-bold text-steel-400">
                          {t.authorName.slice(0, 2).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div>
                      <figcaption className="text-sm font-semibold text-steel-900">{t.authorName}</figcaption>
                      {t.rating && (
                        <span className="text-xs text-amber-500" aria-hidden>
                          {"★".repeat(t.rating)}
                          <span className="text-steel-200">{"★".repeat(5 - t.rating)}</span>
                        </span>
                      )}
                    </div>
                  </div>
                  <blockquote className="mt-3 text-sm leading-6 text-steel-600">“{t.text}”</blockquote>
                </figure>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
