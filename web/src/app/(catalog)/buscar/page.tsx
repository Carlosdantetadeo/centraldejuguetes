import type { Metadata } from "next";
import Link from "next/link";
import { ProductCard } from "@/components/catalog/ProductCard";
import { searchProducts } from "@/lib/catalog";

export const revalidate = 60;

// Resultados de búsqueda: contenido variable por query, no indexable
// (evita páginas delgadas/duplicadas en el buscador — prompt-geo §1).
export const metadata: Metadata = {
  robots: { index: false, follow: true },
};

type PageProps = {
  searchParams: Promise<{ q?: string }>;
};

export default async function SearchPage({ searchParams }: PageProps) {
  const { q = "" } = await searchParams;
  const query = q.trim();
  const results = query ? await searchProducts(query) : [];

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      {/* Breadcrumb */}
      <nav className="mb-4 flex items-center gap-2 text-sm text-steel-600">
        <Link href="/" className="hover:text-brand-700 transition-colors">Inicio</Link>
        <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current stroke-1.5" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
        </svg>
        <span className="font-medium text-steel-800">Buscar</span>
      </nav>

      <h1 className="font-display text-2xl font-bold tracking-tight text-steel-900 sm:text-3xl">
        {query ? `Resultados para "${query}"` : "Buscar productos"}
      </h1>

      {query ? (
        <p className="mt-2 text-sm text-steel-600">
          {results.length} {results.length === 1 ? "resultado" : "resultados"} encontrados
        </p>
      ) : (
        <p className="mt-2 text-sm text-steel-600">
          Escribe un nombre o medida en el buscador superior.
        </p>
      )}

      {query && results.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-steel-300 bg-white p-12 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-steel-100">
            <svg viewBox="0 0 24 24" className="h-8 w-8 fill-none stroke-steel-400 stroke-2" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
          </div>
          <p className="text-lg font-semibold text-steel-700">No encontramos productos</p>
          <p className="mt-1 text-sm text-steel-600">Intenta con otro término o medida.</p>
        </div>
      ) : null}

      {results.length > 0 ? (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {results.map((product) => (
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
              compareAtPrice={product.compareAtPrice}
              stock={product.stock}
              ageMin={product.ageMin}
              ageMax={product.ageMax}
              available={product.available}
              createdAt={product.createdAt}
              categorySlug={product.category.slug}
              image={product.images[0]}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
