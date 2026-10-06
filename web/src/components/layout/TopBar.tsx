import { getSiteSettings } from "@/lib/settings";

// Barra superior fija (prompt-frontend §4.1): horario, envíos, pagos.
// Todo el contenido viene de SiteSettings — si un campo está vacío, no se
// muestra. Si no hay ninguno configurado, la barra entera se omite.
export async function TopBar() {
  const settings = await getSiteSettings();
  const items = [
    settings.businessHours,
    settings.shippingNote,
    settings.paymentMethods,
  ].filter((v): v is string => Boolean(v?.trim()));

  if (items.length === 0) return null;

  return (
    <div className="bg-steel-900 text-steel-200">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-4 gap-y-1 px-4 py-1.5 text-center text-[11px] font-medium sm:text-xs">
        {items.map((item, i) => (
          <span key={i}>
            {i > 0 && <span className="mr-4 text-steel-600">·</span>}
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
