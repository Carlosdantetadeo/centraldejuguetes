import Link from "next/link";
import { ProductImage } from "@/components/catalog/ProductImage";
import { getSiteSettings } from "@/lib/settings";
import { formatPrice } from "@/lib/utils";

type ProductCardProps = {
  id: string;
  name: string;
  sku?: string | null;
  slug: string;
  categoryName?: string | null;
  measure?: string | null;
  gauge?: string | null;
  price: number;
  stock?: number;
  ageMin?: number | null;
  ageMax?: number | null;
  available: boolean;
  categorySlug: string;
  image?: {
    pathMedium: string;
    pathJpegFull: string;
    altText: string;
  } | null;
};

export async function ProductCard({
  name,
  sku,
  slug,
  categoryName,
  measure,
  gauge,
  price,
  stock,
  ageMin,
  ageMax,
  available,
  categorySlug,
  image,
}: ProductCardProps) {
  const settings = await getSiteSettings();
  const specs = [measure, gauge].filter(Boolean).join(" · ");
  const productPath = `/producto/${categorySlug}/${slug}`;
  // Solo se muestra si el stock real es bajo — nunca un número inventado.
  const lowStock = available && typeof stock === "number" && stock > 0 && stock <= 5;
  const ageLabel =
    ageMin != null && ageMax != null
      ? ageMin === ageMax
        ? `${ageMin} años`
        : `${ageMin}–${ageMax} años`
      : null;

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl border border-steel-200 bg-white transition-all duration-300 hover:border-brand-300 hover:shadow-xl hover:shadow-steel-900/8 hover:-translate-y-0.5">
      {/* Badge de stock */}
      {available ? (
        <span className="absolute right-3 top-3 z-10 inline-flex items-center gap-1 rounded-full bg-emerald-500/90 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-sm">
          <span className="h-1.5 w-1.5 rounded-full bg-white" />
          {lowStock ? `Últimas ${stock} unidades` : "En stock"}
        </span>
      ) : (
        <span className="absolute right-3 top-3 z-10 rounded-full bg-steel-900/90 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-sm">
          Sin stock
        </span>
      )}

      {/* Clickable area: image + name */}
      <Link href={productPath} className="block">
        <div className="relative aspect-square overflow-hidden bg-steel-50">
          {image ? (
            <ProductImage
              src={image.pathMedium}
              fallback={image.pathJpegFull}
              alt={image.altText}
              className="h-full w-full object-contain p-3 transition duration-500 group-hover:scale-[1.05]"
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-steel-50">
              <span className="select-none text-5xl opacity-25">📦</span>
            </div>
          )}
        </div>

        <div className="px-4 pt-3 pb-1">
          {categoryName && (
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-brand-500">
              {categoryName}
            </p>
          )}
          {sku ? (
            <p className="mb-1 font-mono text-[10px] font-medium text-steel-400">
              {sku}
            </p>
          ) : null}
          <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-steel-900 transition-colors group-hover:text-brand-700">
            {name}
          </h3>
          {specs ? (
            <p className="mt-1 font-mono text-xs text-steel-500">{specs}</p>
          ) : null}
          {ageLabel ? (
            <p className="mt-1 text-xs font-medium text-brand-600">{ageLabel}</p>
          ) : null}
        </div>
      </Link>

      {/* Price + "Ver modelo" — outside the name link, always at bottom */}
      <div className="mt-auto border-t border-steel-100 px-4 py-3">
        <div className="flex items-end justify-between gap-2">
          <div className="min-w-0">
            <p className="font-mono text-lg font-bold leading-none tracking-tight text-steel-900">
              {formatPrice(price, settings.currency, settings.locale)}
            </p>
            <p className="mt-1 text-[10px] leading-tight text-steel-400">
              {settings.priceLabel}
            </p>
          </div>
          <Link
            href={productPath}
            aria-label={`Ver ficha de ${name}`}
            className="flex shrink-0 items-center gap-1.5 rounded-xl bg-brand-600 px-3.5 py-2 text-xs font-semibold text-white transition-all hover:bg-brand-700 hover:shadow-md hover:shadow-brand-600/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
          >
            Ver ficha
            <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current stroke-2" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </Link>
        </div>
      </div>
    </article>
  );
}
