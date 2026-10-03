import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllCategoriesAdmin, getProductById } from "@/lib/catalog";
import { saveProductAction } from "@/app/admin/actions";
import { ImageUploader } from "@/components/admin/ImageUploader";
import { ProductForm } from "@/components/admin/ProductForm";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditProductPage({ params }: PageProps) {
  const { id } = await params;
  const [product, categories] = await Promise.all([
    getProductById(id),
    getAllCategoriesAdmin(),
  ]);

  if (!product) notFound();

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-steel-500">
        <Link href="/admin/productos" className="hover:text-steel-700">Productos</Link>
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
        <span className="truncate text-steel-900">{product.name}</span>
      </nav>

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-steel-900">Editar producto</h1>
          <p className="mt-1 text-steel-600">{product.name}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`rounded-full px-3 py-1 text-xs font-medium ${
            product.available
              ? "bg-green-50 text-green-700"
              : "bg-red-50 text-red-700"
          }`}>
            {product.available ? "Disponible" : "Agotado"}
          </span>
          {product.featured ? (
            <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
              ★ Destacado
            </span>
          ) : null}
        </div>
      </div>

      <ProductForm
        categories={categories.map((category) => ({
          id: category.id,
          name: category.name,
        }))}
        action={saveProductAction}
        initialValues={product}
      />

      {/* Image uploader */}
      <div className="rounded-2xl border border-steel-200 bg-white p-6">
        <div className="mb-4 flex items-center gap-2">
          <svg className="h-5 w-5 text-steel-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <h2 className="text-sm font-semibold text-steel-900">Imágenes del producto</h2>
          <span className="rounded-full bg-steel-100 px-2 py-0.5 text-xs font-medium text-steel-600">
            {product.images.length}
          </span>
        </div>

        <ImageUploader productId={product.id} productName={product.name} />

        {product.images.length > 0 ? (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {product.images.map((image, index) => (
              <div key={image.id} className="group relative overflow-hidden rounded-xl border border-steel-200">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={image.pathThumb}
                  alt={image.altText}
                  className="aspect-square w-full object-cover"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                  <p className="truncate text-xs text-white">{image.altText}</p>
                </div>
                <div className="absolute right-2 top-2 rounded-lg bg-black/60 px-2 py-0.5 text-xs font-medium text-white">
                  #{index + 1}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-6 rounded-xl border-2 border-dashed border-steel-200 px-4 py-10 text-center">
            <svg className="mx-auto mb-2 h-8 w-8 text-steel-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-sm text-steel-500">Sin imágenes todavía. Sube la primera arriba.</p>
          </div>
        )}
      </div>
    </div>
  );
}
