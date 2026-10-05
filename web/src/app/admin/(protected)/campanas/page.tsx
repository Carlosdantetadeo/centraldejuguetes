import { getAllCampaignsAdmin } from "@/lib/catalog";
import { deleteCampaignAction, saveCampaignAction } from "@/app/admin/actions";

const inputClass =
  "w-full rounded-xl border border-steel-200 bg-white px-4 py-3 text-sm text-steel-900 placeholder-steel-400 outline-none ring-brand-500 focus:ring-2";

// "2026-12-01T10:00" — formato que acepta <input type="datetime-local">.
function toDatetimeLocal(date: Date): string {
  return date.toISOString().slice(0, 16);
}

function isLive(c: { active: boolean; startsAt: Date; endsAt: Date }): boolean {
  const now = new Date();
  return c.active && c.startsAt <= now && c.endsAt >= now;
}

export default async function AdminCampaignsPage() {
  const campaigns = await getAllCampaignsAdmin();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-steel-900">Campañas</h1>
        <p className="mt-1 text-steel-600">
          La campaña vigente (activa y dentro de su rango de fechas) reemplaza el hero genérico de la home.
        </p>
      </div>

      {/* Crear */}
      <form action={saveCampaignAction} className="rounded-2xl border border-steel-200 bg-white p-6">
        <h2 className="mb-5 text-sm font-semibold text-steel-900">Nueva campaña</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label htmlFor="title" className="mb-1.5 block text-sm font-medium text-steel-700">
              Título <span className="text-brand-600">*</span>
            </label>
            <input id="title" name="title" required placeholder="Ej: Navidad 2026" className={inputClass} />
          </div>
          <div>
            <label htmlFor="subtitle" className="mb-1.5 block text-sm font-medium text-steel-700">
              Subtítulo (opcional)
            </label>
            <input id="subtitle" name="subtitle" placeholder="Ej: Pedidos hasta el 20 de diciembre" className={inputClass} />
          </div>
          <div>
            <label htmlFor="ctaLabel" className="mb-1.5 block text-sm font-medium text-steel-700">
              Texto del botón (opcional)
            </label>
            <input id="ctaLabel" name="ctaLabel" placeholder="Ej: Ver catálogo navideño" className={inputClass} />
          </div>
          <div>
            <label htmlFor="ctaUrl" className="mb-1.5 block text-sm font-medium text-steel-700">
              Link del botón (opcional)
            </label>
            <input id="ctaUrl" name="ctaUrl" placeholder="/categoria/navidad" className={inputClass} />
          </div>
          <div>
            <label htmlFor="startsAt" className="mb-1.5 block text-sm font-medium text-steel-700">
              Inicio <span className="text-brand-600">*</span>
            </label>
            <input id="startsAt" name="startsAt" type="datetime-local" required className={inputClass} />
          </div>
          <div>
            <label htmlFor="endsAt" className="mb-1.5 block text-sm font-medium text-steel-700">
              Fin (fecha límite de pedido) <span className="text-brand-600">*</span>
            </label>
            <input id="endsAt" name="endsAt" type="datetime-local" required className={inputClass} />
          </div>
        </div>

        <div className="mt-4">
          <label htmlFor="image" className="mb-1.5 block text-sm font-medium text-steel-700">
            Imagen de fondo (opcional)
          </label>
          <input id="image" name="image" type="file" accept="image/*" className="text-sm text-steel-600" />
        </div>

        <label className="mt-4 flex cursor-pointer items-center gap-2.5 text-sm text-steel-700">
          <input type="checkbox" name="active" defaultChecked className="h-4 w-4 rounded border-steel-300 text-brand-600 focus:ring-brand-500" />
          Activa
        </label>

        <button
          type="submit"
          className="mt-5 rounded-xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-700"
        >
          Crear campaña
        </button>
      </form>

      {/* Lista */}
      <div className="rounded-2xl border border-steel-200 bg-white">
        {campaigns.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-steel-500">
            Aún no hay campañas. Crea la primera con el formulario de arriba.
          </p>
        ) : (
          <div className="divide-y divide-steel-100">
            {campaigns.map((c) => (
              <div key={c.id} className="p-5">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium text-steel-900">{c.title}</p>
                  {isLive(c) ? (
                    <span className="shrink-0 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-700">
                      Vigente ahora
                    </span>
                  ) : (
                    <span className="shrink-0 rounded-full bg-steel-100 px-2.5 py-0.5 text-xs font-medium text-steel-500">
                      {c.active ? "Programada/vencida" : "Inactiva"}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs text-steel-500">
                  {c.startsAt.toLocaleString("es-PE")} → {c.endsAt.toLocaleString("es-PE")}
                </p>

                <details className="group mt-3 rounded-xl border border-steel-200 bg-steel-50/60">
                  <summary className="cursor-pointer list-none px-3 py-2 text-xs font-semibold text-steel-700 hover:text-brand-700">
                    Editar
                  </summary>
                  <form action={saveCampaignAction} className="space-y-3 border-t border-steel-200 p-3">
                    <input type="hidden" name="campaignId" value={c.id} />
                    <input name="title" required defaultValue={c.title} className={inputClass} />
                    <input name="subtitle" defaultValue={c.subtitle ?? ""} className={inputClass} />
                    <input name="ctaLabel" defaultValue={c.ctaLabel ?? ""} className={inputClass} />
                    <input name="ctaUrl" defaultValue={c.ctaUrl ?? ""} className={inputClass} />
                    <div className="grid gap-3 sm:grid-cols-2">
                      <input
                        type="datetime-local"
                        name="startsAt"
                        required
                        defaultValue={toDatetimeLocal(c.startsAt)}
                        className={inputClass}
                      />
                      <input
                        type="datetime-local"
                        name="endsAt"
                        required
                        defaultValue={toDatetimeLocal(c.endsAt)}
                        className={inputClass}
                      />
                    </div>
                    <input type="file" name="image" accept="image/*" className="text-sm text-steel-600" />
                    <label className="flex cursor-pointer items-center gap-2.5 text-sm text-steel-700">
                      <input
                        type="checkbox"
                        name="active"
                        defaultChecked={c.active}
                        className="h-4 w-4 rounded border-steel-300 text-brand-600 focus:ring-brand-500"
                      />
                      Activa
                    </label>
                    <button
                      type="submit"
                      className="rounded-lg bg-brand-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-brand-700"
                    >
                      Guardar cambios
                    </button>
                  </form>
                </details>

                <form action={deleteCampaignAction} className="mt-3">
                  <input type="hidden" name="campaignId" value={c.id} />
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
