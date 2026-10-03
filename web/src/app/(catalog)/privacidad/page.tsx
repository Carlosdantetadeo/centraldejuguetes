import type { Metadata } from "next";
import { getSiteSettings } from "@/lib/settings";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  return {
    title: "Política de privacidad",
    description: `Política de privacidad y tratamiento de datos personales de ${settings.siteName}.`,
  };
}

export default async function PrivacyPage() {
  const settings = await getSiteSettings();
  const entity = settings.legalEntity || settings.siteName;

  // Referencia legal según el país configurado. Se puede afinar por instancia.
  const lawByCountry: Record<string, string> = {
    PE: "la Ley N.° 29733, Ley de Protección de Datos Personales del Perú",
  };
  const lawRef =
    lawByCountry[settings.country.toUpperCase()] ??
    "la legislación de protección de datos personales aplicable";

  // Si la instancia cargó un texto legal propio, se muestra tal cual
  // (respetando saltos de línea) en vez de la plantilla por defecto.
  if (settings.legalText) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="text-3xl font-bold text-steel-900">Política de privacidad</h1>
        <div className="mt-6 space-y-4 leading-7 text-steel-700">
          {settings.legalText.split("\n").map((line, i) =>
            line.trim() ? <p key={i}>{line}</p> : null,
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-bold text-steel-900">Política de privacidad</h1>
      <p className="mt-4 leading-7 text-steel-600">
        {entity} cumple con {lawRef}.
      </p>

      <section className="mt-8 space-y-6 text-steel-700">
        <div>
          <h2 className="text-xl font-semibold text-steel-900">Titular del tratamiento</h2>
          <p className="mt-2 leading-7">
            {entity} es responsable del tratamiento de los datos personales recopilados a
            través de este sitio web y por contacto vía WhatsApp.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-steel-900">Finalidad</h2>
          <p className="mt-2 leading-7">
            Los datos que nos proporciones (nombre, teléfono, RUC u otros) se usarán para atender
            cotizaciones, consultas comerciales y dar seguimiento a pedidos.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-steel-900">Base legal</h2>
          <p className="mt-2 leading-7">
            El tratamiento se realiza con tu consentimiento al contactarnos y por interés legítimo
            en gestionar la relación comercial.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-steel-900">Conservación</h2>
          <p className="mt-2 leading-7">
            Conservaremos tus datos el tiempo necesario para cumplir la finalidad indicada y las
            obligaciones legales aplicables.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-steel-900">Derechos del titular</h2>
          <p className="mt-2 leading-7">
            Puedes solicitar acceso, rectificación, cancelación u oposición escribiéndonos por los
            canales de contacto comercial de {entity}.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-steel-900">Contacto por WhatsApp</h2>
          <p className="mt-2 leading-7">
            Al usar el botón de cotización, serás redirigido a WhatsApp. Los mensajes y datos que
            envíes quedarán sujetos también a las políticas de la plataforma Meta/WhatsApp.
          </p>
        </div>
      </section>
    </div>
  );
}
