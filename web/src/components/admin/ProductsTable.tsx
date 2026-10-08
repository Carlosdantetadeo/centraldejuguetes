"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type Product = {
  id: string;
  name: string;
  slug: string;
  measure: string | null;
  price: number;
  stock: number;
  available: boolean;
  featured: boolean;
  category: { name: string };
  images: { pathThumb: string }[];
};

export function ProductsTable({
  products,
  deleteAction,
}: {
  products: Product[];
  deleteAction: (formData: FormData) => Promise<void>;
}) {
  const [search, setSearch] = useState("");
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (!search.trim()) return products;
    const q = search.toLowerCase();
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.category.name.toLowerCase().includes(q),
    );
  }, [products, search]);

  return (
    <div>
      {/* Search bar */}
      <div className="mb-4 flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-steel-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar producto o categoría…"
            className="w-full rounded-xl border border-steel-200 bg-white py-2.5 pl-10 pr-4 text-sm text-steel-900 placeholder-steel-400 outline-none ring-brand-500 focus:ring-2"
          />
        </div>
        <span className="text-sm text-steel-500">
          {filtered.length} de {products.length}
        </span>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-steel-200 bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-steel-50 text-left text-steel-500">
              <tr>
                <th className="px-4 py-3 font-medium">Producto</th>
                <th className="px-4 py-3 font-medium">Categoría</th>
                <th className="px-4 py-3 font-medium">Precio</th>
                <th className="px-4 py-3 font-medium">Stock</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="sticky right-0 bg-steel-50 px-4 py-3 text-right font-medium shadow-[-6px_0_8px_-4px_rgba(20,24,28,0.12)]">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-steel-100">
              {filtered.map((product) => (
                <tr key={product.id} className="transition hover:bg-steel-50/60">
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      {product.images[0] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={product.images[0].pathThumb}
                          alt={product.name}
                          className="h-10 w-10 shrink-0 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-steel-100 text-steel-400">
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="truncate font-medium text-steel-900">{product.name}</p>
                        <p className="text-xs text-steel-500">{product.measure ?? "—"}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-steel-600">{product.category.name}</td>
                  <td className="px-4 py-4 font-medium text-steel-900">
                    S/ {product.price.toFixed(2)}
                  </td>
                  <td className="px-4 py-4">
                    <span className={`font-medium ${
                      product.stock === 0
                        ? "text-red-600"
                        : product.stock <= 5
                          ? "text-amber-600"
                          : "text-steel-700"
                    }`}>
                      {product.stock}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-wrap gap-1">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        product.available
                          ? "bg-green-50 text-green-700"
                          : "bg-red-50 text-red-700"
                      }`}>
                        {product.available ? "Disponible" : "Agotado"}
                      </span>
                      {product.featured ? (
                        <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                          ★ Destacado
                        </span>
                      ) : null}
                    </div>
                  </td>
                  <td className="sticky right-0 bg-white px-4 py-4 shadow-[-6px_0_8px_-4px_rgba(20,24,28,0.12)]">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/admin/productos/${product.id}/editar`}
                        className="flex items-center gap-1.5 rounded-lg border border-steel-200 px-3 py-1.5 text-xs font-medium text-steel-700 transition hover:bg-steel-50"
                      >
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Editar
                      </Link>
                      {confirmId === product.id ? (
                        <div className="flex items-center gap-1">
                          <form action={deleteAction}>
                            <input type="hidden" name="productId" value={product.id} />
                            <button
                              type="submit"
                              className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-red-700"
                            >
                              Confirmar
                            </button>
                          </form>
                          <button
                            onClick={() => setConfirmId(null)}
                            className="rounded-lg border border-steel-200 px-3 py-1.5 text-xs font-medium text-steel-600 transition hover:bg-steel-50"
                          >
                            Cancelar
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmId(product.id)}
                          className="flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-700 transition hover:bg-red-50"
                        >
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Eliminar
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 ? (
          <div className="px-4 py-12 text-center">
            <svg className="mx-auto mb-3 h-10 w-10 text-steel-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <p className="text-sm text-steel-500">
              {search ? "No se encontraron productos con ese filtro." : "Aún no hay productos cargados."}
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
