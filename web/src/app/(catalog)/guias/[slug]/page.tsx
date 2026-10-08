import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getGuideBySlug, getAllGuides, type GuideTableCell } from "@/lib/guias";
import { getProductsForGuide } from "@/lib/catalog";
import { getSiteSettings } from "@/lib/settings";
import { JsonLd } from "@/components/JsonLd";
import { buildBreadcrumbJsonLd, buildFaqPageJsonLd, buildItemListJsonLd } from "@/lib/jsonld";
import { formatPrice, formatProductName, getSiteUrl } from "@/lib/utils";

export const revalidate = 3600;

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  return getAllGuides().map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const guide = getGuideBySlug(slug);
  if (!guide) return { title: "Guía no encontrada" };

  return {
    title: guide.meta_titulo,
    description: guide.meta_descripcion,
    alternates: { canonical: `${getSiteUrl()}/guias/${guide.slug}` },
  };
}

export default async function GuiaPage({ params }: PageProps) {
  const { slug } = await params;
  const guide = getGuideBySlug(slug);
  if (!guide) notFound();

  const settings = await getSiteSettings();
  const siteUrl = getSiteUrl();
  const products = await getProductsForGuide(guide.productos_citados);

  function productChip(productSlug: string, label?: string) {
    const p = products.get(productSlug);
    if (!p) return label ? <span>{label}</span> : null;
    const name = formatProductName(p.name);
    return (
      <Link
        href={`/producto/${p.category.slug}/${p.slug}`}
        className="inline-flex items-center gap-1.5 rounded-lg border border-steel-200 bg-white px-2.5 py-1 text-xs font-medium text-steel-700 transition-colors hover:border-brand-300 hover:text-brand-700"
      >
        {label ?? name}
        <span className="font-mono text-[11px] text-steel-600">
          {formatPrice(p.price, settings.currency, settings.locale)}
        </span>
        {!p.available && (
          <span className="rounded-full bg-steel-100 px-1.5 text-[10px] text-steel-600">
            Sin stock
          </span>
        )}
      </Link>
    );
  }

  function renderCell(cell: GuideTableCell) {
    if (typeof cell === "string") return cell;
    const p = products.get(cell.slug);
    if (!p) return cell.texto;
    return (
      <Link
        href={`/producto/${p.category.slug}/${p.slug}`}
        className="font-semibold text-brand-600 hover:text-brand-700 hover:underline"
      >
        {cell.texto}
      </Link>
    );
  }

  const itemListUrls = guide.productos_citados
    .map((s) => products.get(s))
    .filter((p): p is NonNullable<typeof p> => Boolean(p))
    .map((p) => ({
      name: formatProductName(p.name),
      url: `${siteUrl}/producto/${p.category.slug}/${p.slug}`,
    }));

  const breadcrumbItems = [
    { name: "Inicio", url: siteUrl },
    { name: "Guías de compra", url: `${siteUrl}/guias` },
    { name: guide.h1, url: `${siteUrl}/guias/${guide.slug}` },
  ];

  const relatedGuides = guide.enlaces_internos
    .map((s) => getGuideBySlug(s))
    .filter((g): g is NonNullable<typeof g> => Boolean(g));

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <JsonLd data={buildBreadcrumbJsonLd(breadcrumbItems)} />
      {guide.faq.length > 0 && <JsonLd data={buildFaqPageJsonLd(guide.faq.map((f) => ({ question: f.q, answer: f.a })))} />}
      {itemListUrls.length > 0 && <JsonLd data={buildItemListJsonLd(itemListUrls)} />}

      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-sm text-steel-600">
        <Link href="/" className="hover:text-brand-700 transition-colors">Inicio</Link>
        <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current stroke-1.5" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
        </svg>
        <Link href="/guias" className="hover:text-brand-700 transition-colors">Guías</Link>
        <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current stroke-1.5" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
        </svg>
        <span className="truncate font-medium text-steel-800">{guide.categoria}</span>
      </nav>

      <p className="text-xs font-semibold uppercase tracking-wide text-brand-500">
        {guide.categoria}
      </p>
      <h1 className="mt-1.5 font-display text-2xl font-bold leading-tight tracking-tight text-steel-900 sm:text-3xl">
        {guide.h1}
      </h1>

      {/* Respuesta directa — pensada para ser citable tal cual */}
      <div className="mt-5 rounded-2xl border-l-4 border-brand-500 bg-brand-50 px-5 py-4">
        <p className="leading-7 text-steel-800">{guide.respuesta_directa}</p>
      </div>

      {/* Tabla comparativa */}
      {guide.tabla && (
        <div className="mt-8 overflow-x-auto">
          <h2 className="mb-3 font-display text-lg font-bold text-steel-900">{guide.tabla.titulo}</h2>
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                {guide.tabla.columnas.map((col) => (
                  <th key={col} className="border-b border-steel-200 bg-steel-50 px-3 py-2 text-left font-semibold text-steel-700">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {guide.tabla.filas.map((fila, i) => (
                <tr key={i}>
                  {fila.map((cell, j) => (
                    <td key={j} className="border-b border-steel-100 px-3 py-2 align-top text-steel-700">
                      {renderCell(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Secciones */}
      <div className="mt-8 space-y-8">
        {guide.secciones.map((s) => (
          <section key={s.h2}>
            <h2 className="font-display text-lg font-bold text-steel-900">{s.h2}</h2>
            <p className="mt-2 leading-7 text-steel-600">{s.parrafo}</p>
            {s.productos.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {s.productos.map((p) => (
                  <span key={p}>{productChip(p)}</span>
                ))}
              </div>
            )}
          </section>
        ))}
      </div>

      {/* Consejos */}
      {guide.consejos.length > 0 && (
        <div className="mt-8 rounded-2xl border border-steel-200 bg-steel-50 p-5">
          <h2 className="font-display text-base font-bold text-steel-900">Consejos rápidos</h2>
          <ul className="mt-3 space-y-2">
            {guide.consejos.map((c, i) => (
              <li key={i} className="flex items-start gap-2 text-sm leading-6 text-steel-600">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" aria-hidden />
                {c}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* FAQ */}
      {guide.faq.length > 0 && (
        <div className="mt-8">
          <h2 className="font-display text-lg font-bold text-steel-900">Preguntas frecuentes</h2>
          <div className="mt-3 space-y-3">
            {guide.faq.map((item) => (
              <details key={item.q} className="group rounded-2xl border border-steel-200 bg-white">
                <summary className="flex cursor-pointer select-none items-center justify-between px-5 py-4 text-sm font-semibold text-steel-900 marker:content-none">
                  {item.q}
                  <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 fill-none stroke-current stroke-2 transition-transform group-open:rotate-180" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                  </svg>
                </summary>
                <div className="border-t border-steel-100 px-5 pb-5 pt-4">
                  <p className="leading-7 text-steel-600">{item.a}</p>
                </div>
              </details>
            ))}
          </div>
        </div>
      )}

      {/* Guías relacionadas */}
      {relatedGuides.length > 0 && (
        <div className="mt-10 border-t border-steel-100 pt-6">
          <h2 className="mb-3 font-display text-base font-bold text-steel-900">Guías relacionadas</h2>
          <div className="flex flex-wrap gap-2">
            {relatedGuides.map((g) => (
              <Link
                key={g.slug}
                href={`/guias/${g.slug}`}
                className="rounded-full border border-steel-200 bg-white px-3.5 py-1.5 text-sm font-medium text-steel-700 transition-colors hover:border-brand-300 hover:text-brand-700"
              >
                {g.h1}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
