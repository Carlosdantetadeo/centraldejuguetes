import type { Metadata } from "next";
import Link from "next/link";
import { getAllGuides } from "@/lib/guias";
import { getSiteSettings } from "@/lib/settings";
import { JsonLd } from "@/components/JsonLd";
import { buildBreadcrumbJsonLd } from "@/lib/jsonld";
import { getSiteUrl } from "@/lib/utils";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  return {
    title: "Guías de compra",
    description: `Guías para elegir el juguete correcto en ${settings.siteName}: por edad, por ocasión y comparativas entre modelos.`,
    alternates: { canonical: `${getSiteUrl()}/guias` },
  };
}

export default async function GuiasIndexPage() {
  const guides = getAllGuides();
  const siteUrl = getSiteUrl();

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <JsonLd
        data={buildBreadcrumbJsonLd([
          { name: "Inicio", url: siteUrl },
          { name: "Guías de compra", url: `${siteUrl}/guias` },
        ])}
      />

      <h1 className="font-display text-3xl font-bold tracking-tight text-steel-900">
        Guías de compra
      </h1>
      <p className="mt-2 max-w-2xl text-steel-600">
        Respuestas directas para elegir el juguete correcto: por edad, por
        ocasión o comparando entre modelos.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {guides.map((guide) => (
          <Link
            key={guide.slug}
            href={`/guias/${guide.slug}`}
            className="group rounded-2xl border border-steel-200 bg-white p-5 transition-all hover:border-brand-300 hover:shadow-lg hover:shadow-steel-900/5"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-500">
              {guide.categoria}
            </p>
            <h2 className="mt-1.5 font-display text-lg font-bold leading-snug text-steel-900 transition-colors group-hover:text-brand-700">
              {guide.h1}
            </h2>
            <p className="mt-2 line-clamp-2 text-sm leading-6 text-steel-500">
              {guide.meta_descripcion}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
