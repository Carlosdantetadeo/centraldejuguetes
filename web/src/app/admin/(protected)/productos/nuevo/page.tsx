import Link from "next/link";
import { getAllCategoriesAdmin } from "@/lib/catalog";
import { saveProductAction } from "@/app/admin/actions";
import { ProductForm } from "@/components/admin/ProductForm";

export default async function NewProductPage() {
  const categories = await getAllCategoriesAdmin();

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-steel-500">
        <Link href="/admin/productos" className="hover:text-steel-700">Productos</Link>
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
        <span className="text-steel-900">Nuevo producto</span>
      </nav>

      <div>
        <h1 className="text-2xl font-bold text-steel-900">Nuevo producto</h1>
        <p className="mt-1 text-steel-600">
          Completa la información básica y guarda para subir fotos.
        </p>
      </div>

      <ProductForm
        categories={categories.map((category) => ({
          id: category.id,
          name: category.name,
        }))}
        action={saveProductAction}
      />
    </div>
  );
}
