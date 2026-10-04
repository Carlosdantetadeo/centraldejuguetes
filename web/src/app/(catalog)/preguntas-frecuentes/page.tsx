import type { Metadata } from "next";
import { getFaqItems } from "@/lib/catalog";
import { getSiteSettings } from "@/lib/settings";
import { JsonLd } from "@/components/JsonLd";
import { buildBreadcrumbJsonLd, buildFaqPageJsonLd } from "@/lib/jsonld";
import { getSiteUrl } from "@/lib/utils";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  return {
    title: "Preguntas frecuentes",
    description: `Respuestas a las preguntas más comunes sobre ${settings.siteName}: envíos, pagos, cambios y más.`,
  };
}

export default async function FaqPage() {
  const items = await getFaqItems();
  const siteUrl = getSiteUrl();

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <JsonLd
        data={buildBreadcrumbJsonLd([
          { name: "Inicio", url: siteUrl },
          { name: "Preguntas frecuentes", url: `${siteUrl}/preguntas-frecuentes` },
        ])}
      />
      {items.length > 0 && <JsonLd data={buildFaqPageJsonLd(items)} />}

      <h1 className="font-display text-3xl font-bold tracking-tight text-steel-900">
        Preguntas frecuentes
      </h1>

      {items.length === 0 ? (
        <p className="mt-6 text-steel-500">
          Aún no hay preguntas publicadas. El administrador puede agregarlas desde el panel.
        </p>
      ) : (
        <div className="mt-6 space-y-3">
          {items.map((item) => (
            <details
              key={item.id}
              className="group rounded-2xl border border-steel-200 bg-white"
            >
              <summary className="flex cursor-pointer select-none items-center justify-between px-5 py-4 text-sm font-semibold text-steel-900 marker:content-none">
                {item.question}
                <svg
                  viewBox="0 0 24 24"
                  className="h-4 w-4 shrink-0 fill-none stroke-current stroke-2 transition-transform group-open:rotate-180"
                  aria-hidden
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                </svg>
              </summary>
              <div className="border-t border-steel-100 px-5 pb-5 pt-4">
                <p className="leading-7 text-steel-600">{item.answer}</p>
              </div>
            </details>
          ))}
        </div>
      )}
    </div>
  );
}
