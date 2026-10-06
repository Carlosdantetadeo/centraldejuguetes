import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductGallery } from "@/components/catalog/ProductGallery";
import { ProductPurchase } from "@/components/catalog/ProductPurchase";
import { ProductViewTracker } from "@/components/catalog/ProductViewTracker";
import { AskWhatsAppLink } from "@/components/catalog/AskWhatsAppLink";
import { ProductCard } from "@/components/catalog/ProductCard";
import { getProductBySlugs, getRelatedProducts } from "@/lib/catalog";
import { getSiteSettings } from "@/lib/settings";
import { formatPrice, formatProductName, getSiteUrl } from "@/lib/utils";
import { buildWhatsAppUrl, getProductUrl } from "@/lib/whatsapp";
import { JsonLd } from "@/components/JsonLd";
import { buildBreadcrumbJsonLd, buildProductJsonLd } from "@/lib/jsonld";

export const revalidate = 60;

// Extrae las tallas de `measure` (ej. "Tallas 38, 39, 40" → ["38","39","40"]).
// Solo lo trata como tallas si viene con la etiqueta "Talla(s)" o hay 2+ valores
// separados por coma; de lo contrario `measure` es una medida normal.
function parseSizes(measure?: string | null): string[] {
  if (!measure) return [];
  const hasLabel = /tallas?/i.test(measure);
  const parts = measure
    .replace(/tallas?/i, "")
    .split(/[,/]/)
    .map((s) => s.trim())
    .filter(Boolean);
  return hasLabel || parts.length >= 2 ? parts : [];
}

type PageProps = {
  params: Promise<{ categorySlug: string; productSlug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { categorySlug, productSlug } = await params;
  const product = await getProductBySlugs(categorySlug, productSlug);
  if (!product) return { title: "Producto no encontrado" };

  const displayName = formatProductName(product.name);
  const description =
    product.description ??
    `${displayName}. ${[product.measure, product.gauge, product.material].filter(Boolean).join(" · ")}`;

  return {
    title: displayName,
    description,
    alternates: { canonical: getProductUrl(categorySlug, productSlug) },
    openGraph: {
      title: displayName,
      description,
      images: product.images[0]
        ? [{ url: product.images[0].pathFull, alt: product.images[0].altText }]
        : undefined,
    },
  };
}

export default async function ProductPage({ params }: PageProps) {
  const { categorySlug, productSlug } = await params;
  const product = await getProductBySlugs(categorySlug, productSlug);
  if (!product) notFound();

  const settings = await getSiteSettings();
  const displayName = formatProductName(product.name);
  const priceTiers =
    (product.priceTiers as { label: string; amount: number }[] | null) ?? [];

  const sizes = parseSizes(product.measure);
  const relatedProducts = await getRelatedProducts(product);

  const siteUrl = getSiteUrl();
  const productUrl = `${siteUrl}/producto/${categorySlug}/${productSlug}`;
  const breadcrumbItems = [
    { name: "Inicio", url: siteUrl },
    { name: product.category.name, url: `${siteUrl}/categoria/${product.category.slug}` },
    { name: displayName, url: productUrl },
  ];
  const askWhatsAppUrl = settings.whatsappNumber
    ? buildWhatsAppUrl(
        { name: displayName, sku: product.sku, productUrl, available: product.available },
        settings.whatsappNumber,
      )
    : null;

  // Detalles técnicos: si `measure` son tallas, se muestran arriba como
  // selector y no se repiten aquí; solo quedan calibre/material/edad/pilas.
  const specs = [
    !sizes.length ? { label: "Medida", value: product.measure } : null,
    { label: "Calibre", value: product.gauge },
    { label: "Material", value: product.material },
    product.ageMin != null && product.ageMax != null
      ? { label: "Edad recomendada", value: `${product.ageMin}–${product.ageMax} años` }
      : null,
    product.batteriesIncluded != null
      ? { label: "Incluye pilas", value: product.batteriesIncluded ? "Sí" : "No" }
      : null,
  ].filter((s): s is { label: string; value: string } => Boolean(s?.value));

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:py-10">
      <JsonLd
        data={buildProductJsonLd(
          {
            name: displayName,
            description: product.description,
            sku: product.sku,
            brand: product.brand,
            ageMin: product.ageMin,
            ageMax: product.ageMax,
            price: product.price,
            available: product.available,
            images: product.images,
            url: productUrl,
          },
          settings,
        )}
      />
      <JsonLd data={buildBreadcrumbJsonLd(breadcrumbItems)} />

      {/* US-14: registra la vista sin depender de la caché ISR */}
      <ProductViewTracker
        productId={product.id}
        name={product.name}
        price={product.price}
        currency={settings.currency}
      />

      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-sm text-steel-500">
        <Link href="/" className="hover:text-brand-700 transition-colors">Inicio</Link>
        <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current stroke-1.5" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
        </svg>
        <a href={`/categoria/${product.category.slug}`} className="hover:text-brand-700 transition-colors">
          {product.category.name}
        </a>
        <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current stroke-1.5" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
        </svg>
        <span className="truncate font-medium text-steel-800">{displayName}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
        {/* Gallery */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <ProductGallery images={product.images} productName={displayName} />
        </div>

        {/* Product info */}
        <div className="flex flex-col">
          {/* Eyebrow: categoría + estado */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-brand-600">
              {product.category.name}
            </span>
            {!product.available && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-steel-200 bg-steel-100 px-2.5 py-0.5 text-[11px] font-semibold text-steel-600">
                <span className="h-1.5 w-1.5 rounded-full bg-steel-400" />
                Sin stock
              </span>
            )}
          </div>

          <h1 className="mt-2 font-display text-2xl font-bold leading-tight tracking-tight text-steel-900 sm:text-3xl">
            {displayName}
          </h1>
          {product.sku && (
            <p className="mt-1 font-mono text-xs font-medium text-brand-600">
              Cód. {product.sku}
            </p>
          )}

          {/* Precios: unidad + por mayor */}
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-steel-200 bg-steel-50 p-3">
              <p className="text-xs font-medium text-steel-500">
                Precio unitario
              </p>
              <p className="mt-1 font-mono text-2xl font-bold text-steel-900">
                {formatPrice(product.price, settings.currency, settings.locale)}
              </p>
              <p className="mt-0.5 text-xs text-steel-500">{settings.priceLabel}</p>
            </div>
            <div className="rounded-xl border border-brand-200 bg-brand-50 p-3">
              <p className="text-xs font-medium text-brand-600">
                Precio por mayor
              </p>
              <p className="mt-1 font-display text-2xl font-bold text-brand-700">
                A consultar
              </p>
              <p className="mt-0.5 text-xs text-brand-600">Consultá por WhatsApp</p>
            </div>
          </div>

          {/* Selector de tallas + CTA de WhatsApp */}
          <div className="mt-6 rounded-2xl border border-steel-200 bg-white p-5">
            <ProductPurchase
              id={product.id}
              sizes={sizes}
              categorySlug={categorySlug}
              productSlug={productSlug}
              name={displayName}
              sku={product.sku}
              price={product.price}
              currency={settings.currency}
              image={product.images[0]?.pathThumb ?? null}
            />
            <p className="mt-3 flex items-start gap-2 text-xs leading-5 text-steel-500">
              <span className="mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-whatsapp" aria-hidden />
              {settings.priceNote}
            </p>
            {askWhatsAppUrl && (
              <AskWhatsAppLink
                href={askWhatsAppUrl}
                productId={product.id}
                name={displayName}
                price={product.price}
                currency={settings.currency}
              />
            )}
          </div>

          {/* Trust strip */}
          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            {[
              { icon: "M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z", label: "Respuesta rápida" },
              { icon: "M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z", label: "Compra segura" },
              { icon: "M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5", label: "Entrega coordinada" },
            ].map(({ icon, label }) => (
              <div key={label} className="flex flex-col items-center gap-1.5 rounded-xl border border-steel-100 bg-steel-50 px-2 py-3">
                <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-brand-600 stroke-1.5" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
                </svg>
                <span className="text-xs font-medium leading-tight text-steel-600">{label}</span>
              </div>
            ))}
          </div>

          {/* Acordeón: Descripción */}
          {product.description && (
            <details className="group mt-4 rounded-2xl border border-steel-200 bg-white" open>
              <summary className="flex cursor-pointer select-none items-center justify-between px-5 py-4 text-sm font-semibold text-steel-900 marker:content-none">
                Descripción del producto
                <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 fill-none stroke-current stroke-2 transition-transform group-open:rotate-180" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                </svg>
              </summary>
              <div className="border-t border-steel-100 px-5 pb-5 pt-4">
                <p className="leading-7 text-steel-600">{product.description}</p>
              </div>
            </details>
          )}

          {/* Acordeón: Detalles técnicos */}
          {specs.length > 0 && (
            <details className="group mt-3 rounded-2xl border border-steel-200 bg-white" open>
              <summary className="flex cursor-pointer select-none items-center justify-between px-5 py-4 text-sm font-semibold text-steel-900 marker:content-none">
                Detalles técnicos
                <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 fill-none stroke-current stroke-2 transition-transform group-open:rotate-180" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                </svg>
              </summary>
              <dl className="divide-y divide-steel-100 border-t border-steel-100 px-5">
                {specs.map((spec) => (
                  <div key={spec.label} className="flex items-center justify-between gap-4 py-3">
                    <dt className="text-sm text-steel-500">{spec.label}</dt>
                    <dd className="font-mono text-sm font-semibold text-steel-900">{spec.value}</dd>
                  </div>
                ))}
              </dl>
            </details>
          )}

          {/* Acordeón: Precios por volumen */}
          {priceTiers.length > 0 && (
            <details className="group mt-3 rounded-2xl border border-steel-200 bg-white" open>
              <summary className="flex cursor-pointer select-none items-center justify-between px-5 py-4 text-sm font-semibold text-steel-900 marker:content-none">
                Precios por volumen
                <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 fill-none stroke-current stroke-2 transition-transform group-open:rotate-180" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                </svg>
              </summary>
              <div className="border-t border-steel-100 px-5 pb-5 pt-4">
                <div className="grid gap-2 sm:grid-cols-3">
                  {priceTiers.map((tier, i) => (
                    <div key={`${tier.label}-${i}`} className="rounded-xl border border-steel-200 bg-steel-50 px-3 py-2.5">
                      <p className="text-[11px] font-medium text-steel-400">{tier.label}</p>
                      <p className="mt-0.5 font-mono text-lg font-bold text-steel-900">
                        {formatPrice(tier.amount, settings.currency, settings.locale)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </details>
          )}

          {/* Video corto, si existe */}
          {product.videoUrl && (
            <details className="group mt-3 rounded-2xl border border-steel-200 bg-white" open>
              <summary className="flex cursor-pointer select-none items-center justify-between px-5 py-4 text-sm font-semibold text-steel-900 marker:content-none">
                Video del producto
                <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 fill-none stroke-current stroke-2 transition-transform group-open:rotate-180" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                </svg>
              </summary>
              <div className="border-t border-steel-100 p-5">
                <div className="aspect-video overflow-hidden rounded-xl bg-steel-900">
                  <video src={product.videoUrl} controls className="h-full w-full" />
                </div>
              </div>
            </details>
          )}

          {/* Contenido de la caja */}
          {product.boxContents && (
            <details className="group mt-3 rounded-2xl border border-steel-200 bg-white" open>
              <summary className="flex cursor-pointer select-none items-center justify-between px-5 py-4 text-sm font-semibold text-steel-900 marker:content-none">
                Contenido de la caja
                <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 fill-none stroke-current stroke-2 transition-transform group-open:rotate-180" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                </svg>
              </summary>
              <div className="border-t border-steel-100 px-5 pb-5 pt-4">
                <p className="leading-7 text-steel-600">{product.boxContents}</p>
              </div>
            </details>
          )}

          {/* Advertencias de seguridad */}
          {product.safetyWarnings && (
            <details className="group mt-3 rounded-2xl border border-amber-200 bg-amber-50" open>
              <summary className="flex cursor-pointer select-none items-center gap-2 px-5 py-4 text-sm font-semibold text-amber-800 marker:content-none">
                <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 fill-none stroke-current stroke-2" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                </svg>
                Advertencias de seguridad
              </summary>
              <div className="border-t border-amber-200 px-5 pb-4 pt-3">
                <p className="leading-6 text-amber-900">{product.safetyWarnings}</p>
              </div>
            </details>
          )}

          <p className="mt-6 text-xs leading-5 text-steel-500">
            Al contactar por WhatsApp, {settings.siteName} tratará tus datos personales conforme a la
            política de privacidad publicada en este sitio.
          </p>
        </div>
      </div>

      {/* Productos relacionados: misma edad y rango de precio */}
      {relatedProducts.length > 0 && (
        <section className="mt-12 border-t border-steel-100 pt-8">
          <h2 className="mb-5 font-display text-lg font-bold tracking-tight text-steel-900">
            Productos relacionados
          </h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {relatedProducts.map((p) => (
              <ProductCard
                key={p.id}
                id={p.id}
                name={p.name}
                sku={p.sku}
                slug={p.slug}
                categoryName={p.category.name}
                measure={p.measure}
                gauge={p.gauge}
                price={p.price}
                stock={p.stock}
                ageMin={p.ageMin}
                ageMax={p.ageMax}
                available={p.available}
                categorySlug={p.category.slug}
                image={p.images[0]}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
