import { getSiteSettings } from "@/lib/settings";

// Franja superior fija: un único mensaje (SiteSettings.shippingNote) en
// cinta animada. Si está vacío, la franja entera se omite. La animación
// respeta prefers-reduced-motion (ver globals.css, .animate-marquee).
export async function TopBar() {
  const settings = await getSiteSettings();
  const message = settings.shippingNote?.trim();

  if (!message) return null;

  // Se repite varias veces para que la cinta nunca se vea "vacía" en
  // pantallas anchas, y la mitad se duplica para que el loop sea continuo.
  const half = Array.from({ length: 8 }, () => message).join("   •   ");

  return (
    <div className="overflow-hidden bg-steel-900 text-steel-200">
      <div className="flex animate-marquee whitespace-nowrap py-1.5 text-[11px] font-medium sm:text-xs">
        <span className="px-4">{half}</span>
        <span className="px-4" aria-hidden="true">
          {half}
        </span>
      </div>
    </div>
  );
}
