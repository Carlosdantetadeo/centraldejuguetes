import { SettingsForm } from "@/components/admin/SettingsForm";
import { getSiteSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const settings = await getSiteSettings();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-steel-900">Configuración del sitio</h1>
        <p className="mt-1 text-steel-600">
          Personaliza el nombre, logo, colores, contacto y datos de tu catálogo. Los cambios se
          reflejan en el sitio público al guardar.
        </p>
      </div>
      <SettingsForm settings={settings} />
    </div>
  );
}
