import Link from "next/link";
import { getAdminStats, getAllProductsAdmin, getTopViewedProducts } from "@/lib/catalog";
import { getSiteSettings } from "@/lib/settings";
import { formatPrice } from "@/lib/utils";

export default async function AdminDashboardPage() {
  const [stats, recentProducts, topViewed, settings] = await Promise.all([
    getAdminStats(),
    getAllProductsAdmin(),
    getTopViewedProducts(10),
    getSiteSettings(),
  ]);

  const recent = recentProducts.slice(0, 5);
  const lowStock = recentProducts.filter((p) => p.stock <= 5).slice(0, 5);

  const cards = [
    {
      label: "Productos",
      value: stats.products,
      hint: "Total en catálogo",
      icon: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4",
      color: "brand",
    },
    {
      label: "Categorías",
      value: stats.categories,
      hint: "Estructura del catálogo",
      icon: "M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z",
      color: "steel",
    },
    {
      label: "Sin stock",
      value: stats.outOfStock,
      hint: "Productos agotados",
      icon: "M12 9v2m0 4h.01M5 21h14a1 1 0 001-1V7a1 1 0 00-1-1H5a1 1 0 00-1 1v13a1 1 0 001 1z",
      color: "amber",
    },
    {
      label: "Destacados",
      value: stats.featured,
      hint: "Mostrados en home",
      icon: "M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z",
      color: "green",
    },
  ];

  const colorMap: Record<string, { bg: string; text: string; ring: string }> = {
    brand: { bg: "bg-brand-50", text: "text-brand-700", ring: "ring-brand-100" },
    steel: { bg: "bg-steel-100", text: "text-steel-700", ring: "ring-steel-200" },
    amber: { bg: "bg-amber-50", text: "text-amber-700", ring: "ring-amber-100" },
    green: { bg: "bg-green-50", text: "text-green-700", ring: "ring-green-100" },
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-steel-900">Resumen del catálogo</h1>
        <p className="mt-1 text-steel-600">
          Administra productos, precios, stock e imágenes desde aquí.
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => {
          const c = colorMap[card.color];
          return (
            <div
              key={card.label}
              className="rounded-2xl border border-steel-200 bg-white p-5 transition hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-steel-500">{card.label}</p>
                  <p className="mt-2 text-3xl font-bold text-steel-900">{card.value}</p>
                  <p className="mt-1 text-xs text-steel-400">{card.hint}</p>
                </div>
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${c.bg} ${c.text} ring-1 ${c.ring}`}>
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={card.icon} />
                  </svg>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-3">
        <Link
          href="/admin/productos/nuevo"
          className="flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-700"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Crear producto
        </Link>
        <Link
          href="/admin/productos"
          className="flex items-center gap-2 rounded-xl border border-steel-200 bg-white px-4 py-3 text-sm font-semibold text-steel-800 transition hover:bg-steel-50"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
          </svg>
          Ver todos
        </Link>
      </div>

      {/* Recent products + low stock */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent */}
        <div className="rounded-2xl border border-steel-200 bg-white">
          <div className="flex items-center justify-between border-b border-steel-100 px-5 py-4">
            <h2 className="text-sm font-semibold text-steel-900">Productos recientes</h2>
            <Link href="/admin/productos" className="text-xs font-medium text-brand-700 hover:underline">
              Ver todos →
            </Link>
          </div>
          <div className="divide-y divide-steel-100">
            {recent.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-steel-500">
                Aún no hay productos cargados.
              </p>
            ) : (
              recent.map((product) => (
                <Link
                  key={product.id}
                  href={`/admin/productos/${product.id}/editar`}
                  className="flex items-center justify-between px-5 py-3 transition hover:bg-steel-50"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-steel-900">{product.name}</p>
                    <p className="text-xs text-steel-500">{product.category.name}</p>
                  </div>
                  <div className="flex items-center gap-3 pl-4">
                    <span className="text-sm font-medium text-steel-700">{formatPrice(product.price, settings.currency, settings.locale)}</span>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      product.available
                        ? "bg-green-50 text-green-700"
                        : "bg-red-50 text-red-700"
                    }`}>
                      {product.available ? "Disponible" : "Sin stock"}
                    </span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Low stock */}
        <div className="rounded-2xl border border-steel-200 bg-white">
          <div className="flex items-center justify-between border-b border-steel-100 px-5 py-4">
            <h2 className="text-sm font-semibold text-steel-900">Stock bajo (≤ 5)</h2>
            <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
              {lowStock.length}
            </span>
          </div>
          <div className="divide-y divide-steel-100">
            {lowStock.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-steel-500">
                Todo el stock está en buen nivel. ✓
              </p>
            ) : (
              lowStock.map((product) => (
                <Link
                  key={product.id}
                  href={`/admin/productos/${product.id}/editar`}
                  className="flex items-center justify-between px-5 py-3 transition hover:bg-steel-50"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-steel-900">{product.name}</p>
                    <p className="text-xs text-steel-500">{product.category.name}</p>
                  </div>
                  <div className="flex items-center gap-2 pl-4">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                      product.stock === 0
                        ? "bg-red-100 text-red-700"
                        : "bg-amber-100 text-amber-700"
                    }`}>
                      {product.stock} u.
                    </span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>

      {/* US-14: Top 10 productos más consultados */}
      <div className="rounded-2xl border border-steel-200 bg-white">
        <div className="flex items-center justify-between border-b border-steel-100 px-5 py-4">
          <h2 className="text-sm font-semibold text-steel-900">Top 10 productos más consultados</h2>
          <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700">
            por vistas
          </span>
        </div>
        <div className="divide-y divide-steel-100">
          {topViewed.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-steel-500">
              Aún no hay vistas registradas. El contador sube cuando los visitantes abren una ficha de producto.
            </p>
          ) : (
            topViewed.map((product, index) => (
              <Link
                key={product.id}
                href={`/admin/productos/${product.id}/editar`}
                className="flex items-center justify-between px-5 py-3 transition hover:bg-steel-50"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-steel-100 text-xs font-bold text-steel-600">
                    {index + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-steel-900">{product.name}</p>
                    <p className="text-xs text-steel-500">{product.category.name}</p>
                  </div>
                </div>
                <span className="pl-4 font-mono text-sm font-semibold text-brand-700">
                  {product.vistas} {product.vistas === 1 ? "vista" : "vistas"}
                </span>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
