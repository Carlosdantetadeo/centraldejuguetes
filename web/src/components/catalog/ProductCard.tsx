import Link from "next/link";
import { ProductImage } from "@/components/catalog/ProductImage";
import { getSiteSettings } from "@/lib/settings";
import { formatPrice, formatProductName } from "@/lib/utils";

type ProductCardProps = {
  id: string;
  name: string;
  sku?: string | null;
  slug: string;
  categoryName?: string | null;
  measure?: string | null;
  gauge?: string | null;
  price: number;
  compareAtPrice?: number | null;
  stock?: number;
  ageMin?: number | null;
  ageMax?: number | null;
  available: boolean;
  categorySlug: string;
  createdAt?: Date;
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
  compareAtPrice,
  stock,
  ageMin,
  ageMax,
  available,
  categorySlug,
  createdAt,
  image,
}: ProductCardProps) {
  const settings = await getSiteSettings();
  const displayName = formatProductName(name);
  const specs = [measure, gauge].filter(Boolean).join(" · ");
  const hasDiscount = compareAtPrice != null && compareAtPrice > price;
  const discountPct = hasDiscount
    ? Math.round((1 - price / compareAtPrice) * 100)
    : null;
  const productPath = `/producto/${categorySlug}/${slug}`;
  // Solo se muestra si el stock real es bajo — nunca un número inventado.
  const lowStock = available && typeof stock === "number" && stock > 0 && stock <= 5;
  // Badge "Nuevo": alta real en las últimas 72h. Ventana corta a propósito:
  // el catálogo se importó en un solo lote, así que una ventana larga (ej.
  // 21 días) marcaría el 100% del catálogo como "nuevo" — ruido, no señal.
  // Server Component — se evalúa una vez por render en el servidor, no hay
  // re-render de cliente que vuelva inestable el valor.
  // eslint-disable-next-line react-hooks/purity
  const isNew = createdAt != null && Date.now() - createdAt.getTime() < 72 * 60 * 60 * 1000;
  const ageLabel =
    ageMin != null && ageMax != null
      ? ageMin === ageMax
        ? `${ageMin} años`
        : `${ageMin}–${ageMax} años`
      : null;

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-steel-200 bg-white transition-all duration-300 hover:border-brand-300 hover:shadow-xl hover:shadow-steel-900/8 hover:-translate-y-0.5">
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

      {/* Badge de descuento / novedad — descuento tiene prioridad visual */}
      {hasDiscount ? (
        <span className="absolute left-3 top-3 z-10 rounded-full bg-rose-600 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-white">
          -{discountPct}%
        </span>
      ) : isNew ? (
        <span className="absolute left-3 top-3 z-10 rounded-full bg-brand-600 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-white">
          Nuevo
        </span>
      ) : null}

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
            <p className="mb-1 truncate text-[10px] font-semibold uppercase tracking-wide text-brand-500">
              {categoryName}
            </p>
          )}
          {sku ? (
            <p className="mb-1 truncate font-mono text-[10px] font-medium text-steel-400">
              {sku}
            </p>
          ) : null}
          <h3 className="line-clamp-2 min-h-[35px] text-sm font-semibold leading-snug text-steel-900 transition-colors group-hover:text-brand-700">
            {displayName}
          </h3>
          {specs ? (
            <p className="mt-1 truncate font-mono text-xs text-steel-500">{specs}</p>
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
            {hasDiscount && (
              <p className="font-mono text-xs font-medium leading-none text-steel-400 line-through">
                {formatPrice(compareAtPrice!, settings.currency, settings.locale)}
              </p>
            )}
            <p
              className={`font-mono text-lg font-bold leading-none tracking-tight ${hasDiscount ? "mt-1 text-rose-600" : "text-steel-900"}`}
            >
              {formatPrice(price, settings.currency, settings.locale)}
            </p>
            <p className="mt-1 text-[10px] leading-tight text-steel-400">
              {settings.priceLabel}
            </p>
          </div>
          <Link
            href={productPath}
            aria-label={`Ver ficha de ${displayName}`}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-600 text-white transition-all hover:bg-brand-700 hover:shadow-md hover:shadow-brand-600/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 sm:w-auto sm:gap-1.5 sm:rounded-xl sm:px-3.5 sm:py-2 sm:text-xs sm:font-semibold"
          >
            <span className="hidden sm:inline">Ver ficha</span>
            <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current stroke-2" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </Link>
        </div>
      </div>
    </article>
  );
}
