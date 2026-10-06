import Link from "next/link";
import { GenderBand } from "@/components/catalog/GenderBand";
import { ProductCard } from "@/components/catalog/ProductCard";
import { SortSelect } from "@/components/catalog/SortSelect";
import { PriceFilterSelect } from "@/components/catalog/PriceFilterSelect";
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

// Mismo lenguaje visual que las tarjetas de GenderBand, para que "Comprar
// por edad" no se vea como una lista de píldoras de texto suelta.
const AGE_CARD_COLORS = ["#fff7ed", "#fdf2f8", "#eff6ff", "#faf5ff", "#f0fdf4"];

type CategoryOption = {
  name: string;
  slug: string;
  count: number;
  imageUrl?: string | null;
};

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

  // Imagen referencial por rango de edad: la foto de un producto real que
  // calza en ese rango (no un stock-photo inventado, no hay ese dato en
  // AGE_RANGES).
  const ageImages: Record<string, string | null> = {};
  for (const range of AGE_RANGES) {
    const match = allProducts.find(
      (p) =>
        p.images.length > 0 &&
        p.ageMin != null &&
        p.ageMax != null &&
        p.ageMin <= range.max &&
        p.ageMax >= range.min,
    );
    ageImages[range.value] = match?.images[0]?.pathThumb ?? null;
  }

  // Ciencia y Juego: categoría a resaltar (pedido explícito) — productos
  // reales de sus subcategorías, no un "más vendidos" inventado (no hay
  // ventas/featured registrados todavía).
  const ciencia = genderRaw.find((g) => g.slug === "ciencia-y-juego");
  const cienciaSlugs = new Set((ciencia?.children ?? []).map((c) => c.slug));
  const cienciaShowcase = allProducts
    .filter((p) => p.available && p.stock > 0 && cienciaSlugs.has(p.category.slug))
    .slice(0, 8);

  // Recién llegados: señal real (fecha de alta), no un "recomendado" inventado.
  const newArrivals = [...allProducts]
    .filter((p) => p.available && p.stock > 0 && p.images.length > 0)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 8);

  const categoryMap = new Map<string, CategoryOption>();
  for (const p of allProducts) {
    const slug = p.category.slug;
    if (!categoryMap.has(slug)) {
      categoryMap.set(slug, { name: p.category.name, slug, count: 0, imageUrl: p.category.imageUrl });
    }
    categoryMap.get(slug)!.count++;
  }
  // Ciencia y Juego primero (categoría a resaltar), el resto alfabético.
  const categoryOptions = [...categoryMap.values()].sort((a, b) => {
    const aFirst = cienciaSlugs.has(a.slug);
    const bFirst = cienciaSlugs.has(b.slug);
    if (aFirst !== bFirst) return aFirst ? -1 : 1;
    return a.name.localeCompare(b.name, "es");
  });

  const byCategory = filters.categoria
    ? allProducts.filter((p) => p.category.slug === filters.categoria)
    : allProducts;

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

      {/* Comprar por edad */}
      <section className="border-b border-steel-100 bg-white py-8">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="mb-4 font-display text-lg font-bold tracking-tight text-steel-900">
            Comprar por edad
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5 sm:gap-4">
            {AGE_RANGES.map((range, i) => {
              const active = filters.edad === range.value;
              const palette = AGE_CARD_COLORS[i % AGE_CARD_COLORS.length];
              const image = ageImages[range.value];
              return (
                <a
                  key={range.value}
                  href={`/?edad=${range.value}#productos`}
                  className={`group relative flex aspect-[4/5] flex-col overflow-hidden rounded-2xl border transition-all hover:-translate-y-0.5 hover:shadow-md ${
                    active ? "border-brand-500 ring-2 ring-brand-200" : "border-steel-200 hover:border-brand-300"
                  }`}
                  style={{ backgroundColor: image ? undefined : palette }}
                >
                  {image ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={image}
                        alt=""
                        aria-hidden="true"
                        className="absolute inset-0 h-full w-full object-cover transition duration-300 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                    </>
                  ) : null}
                  <span
                    className={`relative mt-auto p-3 text-sm font-bold sm:text-base ${
                      image ? "text-white drop-shadow" : active ? "text-brand-700" : "text-steel-800"
                    }`}
                  >
                    {range.label}
                  </span>
                </a>
              );
            })}
          </div>
        </div>
      </section>

      {/* Comprar por presupuesto */}
      <section className="border-b border-steel-100 bg-steel-50 py-8">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="mb-4 font-display text-lg font-bold tracking-tight text-steel-900">
            Comprar por presupuesto
          </h2>
          <PriceFilterSelect />
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
          <>
            {/* Categoría: navegación, separada de los filtros de abajo */}
            <div className="mb-6">
              <h3 className="mb-3 text-[11px] font-semibold text-steel-500">
                Categoría
              </h3>
              <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <Link
                  href="/#productos"
                  className={`shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
                    !filters.categoria
                      ? "border-brand-500 bg-brand-600 text-white"
                      : "border-steel-200 bg-white text-steel-700 hover:border-brand-300"
                  }`}
                >
                  Todas
                </Link>
                {categoryOptions.map((cat) => (
                  <a
                    key={cat.slug}
                    href={`/?categoria=${cat.slug}#productos`}
                    className={`shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
                      filters.categoria === cat.slug
                        ? "border-brand-500 bg-brand-600 text-white"
                        : "border-steel-200 bg-white text-steel-700 hover:border-brand-300"
                    }`}
                  >
                    {cat.name}
                    <span className={filters.categoria === cat.slug ? "ml-1 text-white/70" : "ml-1 text-steel-400"}>
                      ({cat.count})
                    </span>
                  </a>
                ))}
              </div>
            </div>

          {hasActiveFilters ? (
          <div>
              <div className="mb-6 flex flex-wrap items-baseline justify-between gap-3 border-b border-steel-100 pb-3">
                <h2 className="font-display text-xl font-bold tracking-tight text-steel-900">
                  {filters.categoria
                    ? (categoryOptions.find(
                        (c) => c.slug === filters.categoria,
                      )?.name ?? "Productos")
                    : "Resultados"}
                </h2>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs text-steel-500">
                    {sorted.length}{" "}
                    {sorted.length === 1 ? "producto" : "productos"}
                    {" encontrados"}
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
          ) : (
            <div className="space-y-10">
              {/* Ciencia y Juego: categoría a resaltar */}
              {cienciaShowcase.length > 0 && (
                <div>
                  <div className="mb-5 flex flex-wrap items-baseline justify-between gap-3 border-b border-steel-100 pb-3">
                    <h2 className="font-display text-xl font-bold tracking-tight text-steel-900">
                      Ciencia y Juego
                    </h2>
                    <Link
                      href="/categoria/ciencia-y-juego"
                      className="text-sm font-semibold text-brand-600 hover:text-brand-700 hover:underline"
                    >
                      Ver todo →
                    </Link>
                  </div>
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {cienciaShowcase.map((product) => (
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
              )}

              {/* Recién llegados: señal real (fecha de alta) */}
              {newArrivals.length > 0 && (
                <div>
                  <div className="mb-5 flex flex-wrap items-baseline justify-between gap-3 border-b border-steel-100 pb-3">
                    <h2 className="font-display text-xl font-bold tracking-tight text-steel-900">
                      Recién llegados
                    </h2>
                  </div>
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {newArrivals.map((product) => (
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
              )}
            </div>
          )}
          </>
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
