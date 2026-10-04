import { getFaqItems } from "@/lib/catalog";
import { deleteFaqAction, saveFaqAction } from "@/app/admin/actions";

const inputClass =
  "w-full rounded-xl border border-steel-200 bg-white px-4 py-3 text-sm text-steel-900 placeholder-steel-400 outline-none ring-brand-500 focus:ring-2";

export default async function AdminFaqPage() {
  const items = await getFaqItems();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-steel-900">Preguntas frecuentes</h1>
        <p className="mt-1 text-steel-600">
          Se muestran en /preguntas-frecuentes y alimentan el schema FAQPage para buscadores e IA.
        </p>
      </div>

      {/* Crear */}
      <form action={saveFaqAction} className="rounded-2xl border border-steel-200 bg-white p-6">
        <h2 className="mb-5 text-sm font-semibold text-steel-900">Nueva pregunta</h2>
        <div className="space-y-4">
          <div>
            <label htmlFor="question" className="mb-1.5 block text-sm font-medium text-steel-700">
              Pregunta <span className="text-brand-600">*</span>
            </label>
            <input id="question" name="question" required placeholder="Ej: ¿Cuánto tarda el envío?" className={inputClass} />
          </div>
          <div>
            <label htmlFor="answer" className="mb-1.5 block text-sm font-medium text-steel-700">
              Respuesta <span className="text-brand-600">*</span>
            </label>
            <textarea id="answer" name="answer" required rows={3} className={inputClass} />
          </div>
          <div className="w-32">
            <label htmlFor="sortOrder" className="mb-1.5 block text-sm font-medium text-steel-700">
              Orden
            </label>
            <input id="sortOrder" name="sortOrder" type="number" defaultValue={items.length} className={inputClass} />
          </div>
        </div>
        <button
          type="submit"
          className="mt-5 rounded-xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-700"
        >
          Agregar pregunta
        </button>
      </form>

      {/* Lista */}
      <div className="rounded-2xl border border-steel-200 bg-white">
        {items.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-steel-500">
            Aún no hay preguntas. Agrega la primera con el formulario de arriba.
          </p>
        ) : (
          <div className="divide-y divide-steel-100">
            {items.map((item) => (
              <div key={item.id} className="p-5">
                <details className="group">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
                    <span className="font-medium text-steel-900">{item.question}</span>
                    <span className="shrink-0 text-xs text-steel-400">orden {item.sortOrder}</span>
                  </summary>
                  <p className="mt-2 text-sm leading-6 text-steel-600">{item.answer}</p>
                </details>

                <details className="group mt-3 rounded-xl border border-steel-200 bg-steel-50/60">
                  <summary className="cursor-pointer list-none px-3 py-2 text-xs font-semibold text-steel-700 hover:text-brand-700">
                    Editar
                  </summary>
                  <form action={saveFaqAction} className="space-y-3 border-t border-steel-200 p-3">
                    <input type="hidden" name="faqId" value={item.id} />
                    <input name="question" required defaultValue={item.question} className={inputClass} />
                    <textarea name="answer" required rows={3} defaultValue={item.answer} className={inputClass} />
                    <input type="number" name="sortOrder" defaultValue={item.sortOrder} className={`${inputClass} w-32`} />
                    <button
                      type="submit"
                      className="rounded-lg bg-brand-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-brand-700"
                    >
                      Guardar cambios
                    </button>
                  </form>
                </details>

                <form action={deleteFaqAction} className="mt-3">
                  <input type="hidden" name="faqId" value={item.id} />
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
