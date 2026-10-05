import { getAllGeoQueriesAdmin } from "@/lib/catalog";
import { deleteGeoQueryAction, saveGeoQueryAction } from "@/app/admin/actions";

const inputClass =
  "w-full rounded-xl border border-steel-200 bg-white px-4 py-3 text-sm text-steel-900 placeholder-steel-400 outline-none ring-brand-500 focus:ring-2";

const ENGINES = [
  { key: "foundChatGpt", label: "ChatGPT" },
  { key: "foundGemini", label: "Gemini" },
  { key: "foundPerplexity", label: "Perplexity" },
  { key: "foundCopilot", label: "Copilot" },
  { key: "foundClaude", label: "Claude" },
] as const;

export default async function AdminGeoQueriesPage() {
  const items = await getAllGeoQueriesAdmin();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-steel-900">Consultas objetivo (GEO)</h1>
        <p className="mt-1 text-steel-600">
          20–30 búsquedas reales que le harías a un motor de IA (ej. "juguetes didácticos Lima",
          "regalo niño 5 años menos de 100 soles"). Revisión <strong>manual</strong> y mensual: marca
          si la tienda aparece o es citada en cada motor — nada de scraping automatizado.
        </p>
      </div>

      <form action={saveGeoQueryAction} className="rounded-2xl border border-steel-200 bg-white p-6">
        <h2 className="mb-5 text-sm font-semibold text-steel-900">Nueva consulta</h2>
        <input name="query" required placeholder='Ej: "juguetes de madera Lima"' className={inputClass} />
        <textarea name="notes" placeholder="Notas (opcional)" rows={2} className={`${inputClass} mt-3`} />
        <button
          type="submit"
          className="mt-4 rounded-xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-700"
        >
          Agregar consulta
        </button>
      </form>

      <div className="overflow-x-auto rounded-2xl border border-steel-200 bg-white">
        {items.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-steel-500">
            Aún no hay consultas. Agrega la primera con el formulario de arriba.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-steel-100 bg-steel-50 text-left text-xs font-semibold text-steel-500">
                <th className="px-4 py-3">Consulta</th>
                {ENGINES.map((e) => (
                  <th key={e.key} className="px-3 py-3 text-center">{e.label}</th>
                ))}
                <th className="px-4 py-3">Última revisión</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b border-steel-50">
                  <td className="px-4 py-3 font-medium text-steel-900">{item.query}</td>
                  {ENGINES.map((e) => (
                    <td key={e.key} className="px-3 py-3 text-center">
                      {item[e.key] ? (
                        <span className="text-green-600">✓</span>
                      ) : (
                        <span className="text-steel-300">—</span>
                      )}
                    </td>
                  ))}
                  <td className="px-4 py-3 text-xs text-steel-500">
                    {item.lastCheckedAt ? new Date(item.lastCheckedAt).toLocaleDateString("es-PE") : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <details className="group">
                      <summary className="cursor-pointer list-none text-xs font-semibold text-brand-600 hover:text-brand-700">
                        Editar
                      </summary>
                      <div className="absolute z-10 mt-2 w-80 rounded-xl border border-steel-200 bg-white p-4 shadow-xl">
                        <form action={saveGeoQueryAction} className="space-y-3">
                          <input type="hidden" name="geoQueryId" value={item.id} />
                          <input name="query" required defaultValue={item.query} className={inputClass} />
                          <div className="grid grid-cols-2 gap-2">
                            {ENGINES.map((e) => (
                              <label key={e.key} className="flex items-center gap-2 text-xs text-steel-700">
                                <input
                                  type="checkbox"
                                  name={e.key}
                                  defaultChecked={item[e.key]}
                                  className="h-4 w-4 rounded border-steel-300 text-brand-600 focus:ring-brand-500"
                                />
                                {e.label}
                              </label>
                            ))}
                          </div>
                          <textarea name="notes" defaultValue={item.notes ?? ""} rows={2} className={inputClass} />
                          <button
                            type="submit"
                            className="w-full rounded-lg bg-brand-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-brand-700"
                          >
                            Guardar (marca como revisado hoy)
                          </button>
                        </form>
                        <form action={deleteGeoQueryAction} className="mt-2">
                          <input type="hidden" name="geoQueryId" value={item.id} />
                          <button
                            type="submit"
                            className="w-full rounded-lg border border-red-200 px-4 py-2 text-xs font-medium text-red-700 transition hover:bg-red-50"
                          >
                            Eliminar
                          </button>
                        </form>
                      </div>
                    </details>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
