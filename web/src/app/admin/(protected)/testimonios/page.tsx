import { getAllTestimonialsAdmin } from "@/lib/catalog";
import { deleteTestimonialAction, saveTestimonialAction } from "@/app/admin/actions";

const inputClass =
  "w-full rounded-xl border border-steel-200 bg-white px-4 py-3 text-sm text-steel-900 placeholder-steel-400 outline-none ring-brand-500 focus:ring-2";

function Stars({ rating }: { rating: number | null }) {
  if (!rating) return null;
  return (
    <span className="text-amber-500" aria-hidden>
      {"★".repeat(rating)}
      <span className="text-steel-200">{"★".repeat(5 - rating)}</span>
    </span>
  );
}

export default async function AdminTestimonialsPage() {
  const items = await getAllTestimonialsAdmin();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-steel-900">Testimonios</h1>
        <p className="mt-1 text-steel-600">
          Prueba social de la home. Solo se publican testimonios reales de clientes — no se inventan.
        </p>
      </div>

      {/* Crear */}
      <form action={saveTestimonialAction} className="rounded-2xl border border-steel-200 bg-white p-6">
        <h2 className="mb-5 text-sm font-semibold text-steel-900">Nuevo testimonio</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label htmlFor="authorName" className="mb-1.5 block text-sm font-medium text-steel-700">
              Nombre del cliente <span className="text-brand-600">*</span>
            </label>
            <input id="authorName" name="authorName" required placeholder="Ej: María G." className={inputClass} />
          </div>
          <div>
            <label htmlFor="rating" className="mb-1.5 block text-sm font-medium text-steel-700">
              Calificación (1–5, opcional)
            </label>
            <input id="rating" name="rating" type="number" min={1} max={5} className={inputClass} />
          </div>
        </div>
        <div className="mt-4">
          <label htmlFor="text" className="mb-1.5 block text-sm font-medium text-steel-700">
            Testimonio <span className="text-brand-600">*</span>
          </label>
          <textarea id="text" name="text" required rows={3} className={inputClass} />
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <label htmlFor="image" className="mb-1.5 block text-sm font-medium text-steel-700">
              Foto del cliente (opcional)
            </label>
            <input id="image" name="image" type="file" accept="image/*" className="text-sm text-steel-600" />
          </div>
          <div className="w-32">
            <label htmlFor="sortOrder" className="mb-1.5 block text-sm font-medium text-steel-700">
              Orden
            </label>
            <input id="sortOrder" name="sortOrder" type="number" defaultValue={items.length} className={inputClass} />
          </div>
        </div>
        <label className="mt-4 flex cursor-pointer items-center gap-2.5 text-sm text-steel-700">
          <input type="checkbox" name="published" defaultChecked className="h-4 w-4 rounded border-steel-300 text-brand-600 focus:ring-brand-500" />
          Publicado
        </label>
        <button
          type="submit"
          className="mt-5 rounded-xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-700"
        >
          Agregar testimonio
        </button>
      </form>

      {/* Lista */}
      <div className="rounded-2xl border border-steel-200 bg-white">
        {items.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-steel-500">
            Aún no hay testimonios. Agrega el primero con el formulario de arriba.
          </p>
        ) : (
          <div className="divide-y divide-steel-100">
            {items.map((item) => (
              <div key={item.id} className="p-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-steel-200 bg-steel-100">
                    {item.imageUrl ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={item.imageUrl} alt={item.authorName} className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-xs font-bold text-steel-400">
                        {item.authorName.slice(0, 2).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium text-steel-900">{item.authorName}</p>
                      {!item.published && (
                        <span className="shrink-0 rounded-full bg-steel-100 px-2 py-0.5 text-xs font-medium text-steel-500">
                          Oculto
                        </span>
                      )}
                    </div>
                    <Stars rating={item.rating} />
                    <p className="mt-1 text-sm leading-6 text-steel-600">{item.text}</p>
                  </div>
                </div>

                <details className="group mt-3 rounded-xl border border-steel-200 bg-steel-50/60">
                  <summary className="cursor-pointer list-none px-3 py-2 text-xs font-semibold text-steel-700 hover:text-brand-700">
                    Editar
                  </summary>
                  <form action={saveTestimonialAction} className="space-y-3 border-t border-steel-200 p-3">
                    <input type="hidden" name="testimonialId" value={item.id} />
                    <input name="authorName" required defaultValue={item.authorName} className={inputClass} />
                    <textarea name="text" required rows={3} defaultValue={item.text} className={inputClass} />
                    <div className="grid gap-3 sm:grid-cols-2">
                      <input type="number" name="rating" min={1} max={5} defaultValue={item.rating ?? ""} className={inputClass} />
                      <input type="number" name="sortOrder" defaultValue={item.sortOrder} className={inputClass} />
                    </div>
                    <input type="file" name="image" accept="image/*" className="text-sm text-steel-600" />
                    <label className="flex cursor-pointer items-center gap-2.5 text-sm text-steel-700">
                      <input
                        type="checkbox"
                        name="published"
                        defaultChecked={item.published}
                        className="h-4 w-4 rounded border-steel-300 text-brand-600 focus:ring-brand-500"
                      />
                      Publicado
                    </label>
                    <button
                      type="submit"
                      className="rounded-lg bg-brand-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-brand-700"
                    >
                      Guardar cambios
                    </button>
                  </form>
                </details>

                <form action={deleteTestimonialAction} className="mt-3">
                  <input type="hidden" name="testimonialId" value={item.id} />
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-700 transition hover:bg-red-50"
                  >
                    Eliminar
                  </button>
                </form>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
