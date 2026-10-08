import Link from "next/link";
import { getAllProductsAdmin } from "@/lib/catalog";
import { deleteProductAction } from "@/app/admin/actions";
import { ProductsTable } from "@/components/admin/ProductsTable";

export default async function AdminProductsPage() {
  const products = await getAllProductsAdmin();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-steel-900">Productos</h1>
          <p className="mt-1 text-steel-600">
            {products.length} producto{products.length !== 1 ? "s" : ""} en el catálogo · Administra precios, stock e imágenes.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/productos/actualizar-masivo"
            className="flex items-center gap-2 rounded-xl border border-steel-200 bg-white px-4 py-3 text-sm font-semibold text-steel-700 transition hover:bg-steel-50"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Actualizar stock y precio
          </Link>
          <Link
            href="/admin/productos/nuevo"
            className="flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-700"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Nuevo producto
          </Link>
        </div>
      </div>

      <ProductsTable products={products} deleteAction={deleteProductAction} />
    </div>
  );
}
