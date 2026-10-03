import { getAllCategoriesAdmin } from "@/lib/catalog";
import { deleteCategoryAction, saveCategoryAction } from "@/app/admin/actions";

type PageProps = {
  searchParams: Promise<{ error?: string }>;
};

type CategoryAdmin = Awaited<ReturnType<typeof getAllCategoriesAdmin>>[number];

const inputClass =
  "w-full rounded-xl border border-steel-200 bg-white px-4 py-3 text-sm text-steel-900 placeholder-steel-400 outline-none ring-brand-500 focus:ring-2";

/** Panel de edición desplegable (sin JS de cliente) para renombrar, mover o describir una categoría. */
function CategoryEditPanel({
  category,
  rootCategories,
}: {
  category: CategoryAdmin;
  rootCategories: CategoryAdmin[];
}) {
  // Solo permitimos árbol de 2 niveles: una categoría no puede ser su propio padre.
  const parentOptions = rootCategories.filter((c) => c.id !== category.id);

  return (
    <details className="mt-3 rounded-xl border border-steel-200 bg-steel-50/60">
      <summary className="cursor-pointer list-none px-3 py-2 text-xs font-semibold text-steel-700 hover:text-brand-700">
        Editar datos
      </summary>
      <form action={saveCategoryAction} className="space-y-3 border-t border-steel-200 p-3">
        <input type="hidden" name="categoryId" value={category.id} />
        <div>
          <label className="mb-1 block text-xs font-medium text-steel-600">Nombre</label>
          <input name="name" required defaultValue={category.name} className={inputClass} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-steel-600">
            Slug (URL) · déjalo vacío para regenerarlo del nombre
          </label>
          <input name="slug" defaultValue={category.slug} className={inputClass} />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-steel-600">Categoría padre</label>
            <select name="parentId" defaultValue={category.parentId ?? ""} className={inputClass}>
              <option value="">Ninguna (categoría raíz)</option>
              {parentOptions.map((parent) => (
                <option key={parent.id} value={parent.id}>
                  {parent.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-steel-600">Orden</label>
            <input
              type="number"
              name="sortOrder"
              defaultValue={category.sortOrder}
              className={inputClass}
            />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-steel-600">Descripción (opcional)</label>
          <input name="description" defaultValue={category.description ?? ""} className={inputClass} />
        </div>
        <div className="flex items-center gap-2">
          <button
            type="submit"
            className="rounded-lg bg-brand-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-brand-700"
          >
            Guardar cambios
          </button>
        </div>
      </form>
    </details>
  );
}

/** Botón de eliminar (formulario propio para no anidar en el de edición). */
function DeleteCategoryButton({ categoryId }: { categoryId: string }) {
  return (
    <form action={deleteCategoryAction}>
      <input type="hidden" name="categoryId" value={categoryId} />
      <button
        type="submit"
        className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-700 transition hover:bg-red-50"
      >
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
        Eliminar
      </button>
    </form>
  );
}

export default async function AdminCategoriesPage({ searchParams }: PageProps) {
  const { error } = await searchParams;
  const categories = await getAllCategoriesAdmin();
  const rootCategories = categories.filter((category) => !category.parentId);
  const subCategories = categories.filter((category) => category.parentId);

  const errorMessages: Record<string, string> = {
    "has-products": "No puedes eliminar una categoría que todavía tiene productos.",
    "has-children": "No puedes eliminar una categoría que tiene subcategorías. Elimínalas o muévelas primero.",
    invalid: "Revisa los datos: el nombre es obligatorio.",
  };
  const errorMessage = error ? errorMessages[error] : undefined;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-steel-900">Categorías</h1>
        <p className="mt-1 text-steel-600">
          {rootCategories.length} categorías raíz · {subCategories.length} subcategorías
        </p>
      </div>

      {/* Error */}
      {errorMessage ? (
        <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {errorMessage}
        </div>
      ) : null}

      {/* Crear categoría */}
      <form action={saveCategoryAction} className="rounded-2xl border border-steel-200 bg-white p-6">
        <div className="mb-5 flex items-center gap-2">
          <svg className="h-5 w-5 text-steel-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          <h2 className="text-sm font-semibold text-steel-900">Nueva categoría</h2>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-steel-700">
              Nombre <span className="text-brand-600">*</span>
            </label>
            <input
              id="name"
              name="name"
              required
              placeholder="Ej: Malla Olímpica"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="parentId" className="mb-1.5 block text-sm font-medium text-steel-700">
              Categoría padre
            </label>
            <select id="parentId" name="parentId" className={inputClass}>
              <option value="">Ninguna (categoría raíz)</option>
              {rootCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-steel-400">
              Déjalo en “Ninguna” para crear una categoría principal.
            </p>
          </div>
        </div>

        <div className="mt-4">
          <label htmlFor="description" className="mb-1.5 block text-sm font-medium text-steel-700">
            Descripción (opcional)
          </label>
          <input
            id="description"
            name="description"
            placeholder="Breve descripción de la categoría"
            className={inputClass}
          />
        </div>

        <button
          type="submit"
          className="mt-5 flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-700"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Crear categoría
        </button>
      </form>

      {/* Categorías raíz */}
      <div className="rounded-2xl border border-steel-200 bg-white">
        <div className="border-b border-steel-100 px-5 py-4">
          <h2 className="text-sm font-semibold text-steel-900">Categorías raíz</h2>
          <p className="mt-0.5 text-xs text-steel-500">Subí una imagen para que se vea en el inicio</p>
        </div>
        {rootCategories.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-steel-500">
            Aún no hay categorías. Crea la primera con el formulario de arriba.
          </p>
        ) : (
          <div className="grid gap-px bg-steel-100 sm:grid-cols-2 lg:grid-cols-3">
            {rootCategories.map((category) => (
              <div key={category.id} className="bg-white p-5">
                <div className="flex items-start gap-3">
                  {/* Miniatura */}
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-steel-200 bg-steel-100">
                    {category.imageUrl ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={category.imageUrl} alt={category.name} className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-sm font-bold text-steel-400">
                        {category.name.slice(0, 2).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="truncate font-medium text-steel-900">{category.name}</p>
                      <span className="shrink-0 rounded-full bg-steel-100 px-2 py-0.5 text-xs font-medium text-steel-600">
                        {category._count.products} prod.
                      </span>
                    </div>
                    {category._count.children > 0 ? (
                      <p className="mt-1 text-xs text-steel-400">
                        {category._count.children} subcategoría{category._count.children !== 1 ? "s" : ""}
                      </p>
                    ) : null}

                    {/* Subir/cambiar imagen */}
                    <form action={saveCategoryAction} className="mt-3 flex flex-wrap items-center gap-2">
                      <input type="hidden" name="categoryId" value={category.id} />
                      <input type="hidden" name="name" value={category.name} />
                      <input type="hidden" name="slug" value={category.slug} />
                      <input type="hidden" name="sortOrder" value={category.sortOrder} />
                      {category.parentId ? (
                        <input type="hidden" name="parentId" value={category.parentId} />
                      ) : null}
                      {category.description ? (
                        <input type="hidden" name="description" value={category.description} />
                      ) : null}
                      <input
                        type="file"
                        name="image"
                        accept="image/*"
                        required
                        className="max-w-[10rem] text-xs text-steel-600 file:mr-2 file:rounded-md file:border-0 file:bg-steel-100 file:px-2 file:py-1 file:text-xs file:font-medium file:text-steel-700 hover:file:bg-steel-200"
                      />
                      <button
                        type="submit"
                        className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-700"
                      >
                        Guardar imagen
                      </button>
                    </form>

                    {/* Editar datos */}
                    <CategoryEditPanel category={category} rootCategories={rootCategories} />

                    {/* Eliminar */}
                    <div className="mt-3">
                      <DeleteCategoryButton categoryId={category.id} />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Subcategorías */}
      {subCategories.length > 0 ? (
        <div className="rounded-2xl border border-steel-200 bg-white">
          <div className="border-b border-steel-100 px-5 py-4">
            <h2 className="text-sm font-semibold text-steel-900">Subcategorías</h2>
          </div>
          <div className="grid gap-px bg-steel-100 sm:grid-cols-2">
            {subCategories.map((category) => (
              <div key={category.id} className="bg-white p-5">
                <div className="flex items-start gap-3">
                  {/* Miniatura */}
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-steel-200 bg-steel-100">
                    {category.imageUrl ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={category.imageUrl} alt={category.name} className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-sm font-bold text-steel-400">
                        {category.name.slice(0, 2).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate font-medium text-steel-900">{category.name}</p>
                        <p className="mt-0.5 text-xs text-steel-500">
                          En: {category.parent?.name ?? "—"}
                        </p>
                      </div>
                      <span className="shrink-0 rounded-full bg-steel-100 px-2 py-0.5 text-xs font-medium text-steel-600">
                        {category._count.products} prod.
                      </span>
                    </div>

                    {/* Subir/cambiar imagen */}
                    <form action={saveCategoryAction} className="mt-3 flex flex-wrap items-center gap-2">
                      <input type="hidden" name="categoryId" value={category.id} />
                      <input type="hidden" name="name" value={category.name} />
                      <input type="hidden" name="slug" value={category.slug} />
                      <input type="hidden" name="sortOrder" value={category.sortOrder} />
                      {category.parentId ? (
                        <input type="hidden" name="parentId" value={category.parentId} />
                      ) : null}
                      {category.description ? (
                        <input type="hidden" name="description" value={category.description} />
                      ) : null}
                      <input
                        type="file"
                        name="image"
                        accept="image/*"
                        required
                        className="max-w-[10rem] text-xs text-steel-600 file:mr-2 file:rounded-md file:border-0 file:bg-steel-100 file:px-2 file:py-1 file:text-xs file:font-medium file:text-steel-700 hover:file:bg-steel-200"
                      />
                      <button
                        type="submit"
                        className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-700"
                      >
                        Guardar imagen
                      </button>
                    </form>

                    {/* Editar datos */}
                    <CategoryEditPanel category={category} rootCategories={rootCategories} />

                    {/* Eliminar */}
                    <div className="mt-3">
                      <DeleteCategoryButton categoryId={category.id} />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
