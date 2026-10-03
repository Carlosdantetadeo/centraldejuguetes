"use client";

import type { SiteSettings } from "@prisma/client";
import { useActionState, useState } from "react";
import { saveSettingsAction, type SettingsFormState } from "@/app/admin/actions";

function Field({
  label,
  name,
  defaultValue,
  placeholder,
  type = "text",
  required = false,
  hint,
}: {
  label: string;
  name: string;
  defaultValue?: string | null;
  placeholder?: string;
  type?: string;
  required?: boolean;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-steel-700">{label}</span>
      <input
        type={type}
        name={name}
        defaultValue={defaultValue ?? ""}
        placeholder={placeholder}
        required={required}
        className="mt-1 w-full rounded-lg border border-steel-300 px-3 py-2 text-sm text-steel-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
      />
      {hint ? <span className="mt-1 block text-xs text-steel-400">{hint}</span> : null}
    </label>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-steel-200 bg-white p-5">
      <h2 className="mb-4 text-sm font-semibold text-steel-900">{title}</h2>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </section>
  );
}

export function SettingsForm({ settings }: { settings: SiteSettings }) {
  const [state, formAction, pending] = useActionState<SettingsFormState, FormData>(
    saveSettingsAction,
    {},
  );
  const [brandColor, setBrandColor] = useState(settings.brandColor);
  const [logoPreview, setLogoPreview] = useState<string | null>(settings.logoUrl);
  const [heroPreview, setHeroPreview] = useState<string | null>(settings.heroImageUrl);

  return (
    <form action={formAction} className="space-y-6">
      {/* Identidad */}
      <Card title="Identidad">
        <div className="sm:col-span-2">
          <Field label="Nombre del sitio" name="siteName" defaultValue={settings.siteName} required />
        </div>
        <label className="block sm:col-span-2">
          <span className="text-sm font-medium text-steel-700">Descripción</span>
          <textarea
            name="siteDescription"
            defaultValue={settings.siteDescription}
            rows={2}
            required
            className="mt-1 w-full rounded-lg border border-steel-300 px-3 py-2 text-sm text-steel-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </label>

        {/* Logo */}
        <div className="sm:col-span-2">
          <span className="text-sm font-medium text-steel-700">Logo</span>
          <div className="mt-1 flex items-center gap-4">
            <div className="flex h-14 w-40 items-center justify-center overflow-hidden rounded-lg border border-steel-200 bg-steel-50">
              {logoPreview ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={logoPreview} alt="Logo actual" className="h-full w-auto object-contain" />
              ) : (
                <span className="text-xs text-steel-400">Sin logo</span>
              )}
            </div>
            <input
              type="file"
              name="logo"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) setLogoPreview(URL.createObjectURL(file));
              }}
              className="text-sm text-steel-600 file:mr-3 file:rounded-lg file:border-0 file:bg-steel-100 file:px-3 file:py-2 file:text-sm file:font-medium file:text-steel-700 hover:file:bg-steel-200"
            />
          </div>
          <span className="mt-1 block text-xs text-steel-400">
            PNG con fondo transparente recomendado. Si no subes uno, se muestra el nombre del sitio.
          </span>
        </div>

        {/* Imagen de fondo del hero */}
        <div className="sm:col-span-2">
          <span className="text-sm font-medium text-steel-700">Imagen de fondo del hero (portada)</span>
          <div className="mt-1 flex items-center gap-4">
            <div className="flex h-20 w-36 items-center justify-center overflow-hidden rounded-lg border border-steel-200 bg-steel-100">
              {heroPreview ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={heroPreview} alt="Portada actual" className="h-full w-full object-cover" />
              ) : (
                <span className="text-xs text-steel-400">Sin imagen</span>
              )}
            </div>
            <input
              type="file"
              name="heroImage"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) setHeroPreview(URL.createObjectURL(file));
              }}
              className="text-sm text-steel-600 file:mr-3 file:rounded-lg file:border-0 file:bg-steel-100 file:px-3 file:py-2 file:text-sm file:font-medium file:text-steel-700 hover:file:bg-steel-200"
            />
          </div>
          <span className="mt-1 block text-xs text-steel-400">
            Foto horizontal (paisaje) de buena calidad. Se le aplica un degradado oscuro para que el texto se lea. Si no subes una, el hero usa el fondo de color.
          </span>
        </div>
      </Card>

      {/* Tema */}
      <Card title="Tema (color de marca)">
        <label className="block">
          <span className="text-sm font-medium text-steel-700">Color de marca</span>
          <div className="mt-1 flex items-center gap-2">
            <input
              type="color"
              value={brandColor}
              onChange={(e) => setBrandColor(e.target.value)}
              className="h-10 w-14 shrink-0 cursor-pointer rounded border border-steel-300"
              aria-label="Selector de color de marca"
            />
            <input
              type="text"
              name="brandColor"
              value={brandColor}
              onChange={(e) => setBrandColor(e.target.value)}
              className="w-full rounded-lg border border-steel-300 px-3 py-2 font-mono text-sm text-steel-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>
          <span className="mt-1 block text-xs text-steel-400">
            Formato #RRGGBB. Los tonos claros y oscuros se generan automáticamente.
          </span>
        </label>

        {/* Preview en vivo */}
        <div>
          <span className="text-sm font-medium text-steel-700">Vista previa</span>
          <div className="mt-1 flex items-center gap-3 rounded-lg border border-steel-200 p-3">
            <button
              type="button"
              style={{ backgroundColor: brandColor }}
              className="rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-sm"
            >
              Botón
            </button>
            <span
              className="rounded-full px-3 py-1 text-xs font-semibold"
              style={{ backgroundColor: `${brandColor}1a`, color: brandColor }}
            >
              Etiqueta
            </span>
            <span className="font-mono text-sm" style={{ color: brandColor }}>
              {brandColor}
            </span>
          </div>
        </div>
      </Card>

      {/* Contacto */}
      <Card title="Contacto">
        <Field
          label="WhatsApp"
          name="whatsappNumber"
          defaultValue={settings.whatsappNumber}
          placeholder="51999888777"
          hint="Con código de país, solo dígitos."
        />
        <Field label="Teléfono (mostrado)" name="phone" defaultValue={settings.phone} placeholder="+51 999 888 777" />
        <div className="sm:col-span-2">
          <Field label="Dirección" name="address" defaultValue={settings.address} />
        </div>
        <div className="sm:col-span-2">
          <Field label="Tagline del footer" name="footerTagline" defaultValue={settings.footerTagline} />
        </div>
      </Card>

      {/* Redes */}
      <Card title="Redes sociales">
        <Field label="Facebook (URL)" name="socialFacebook" type="url" defaultValue={settings.socialFacebook} placeholder="https://facebook.com/..." />
        <Field label="Instagram (URL)" name="socialInstagram" type="url" defaultValue={settings.socialInstagram} placeholder="https://instagram.com/..." />
        <Field label="TikTok (URL)" name="socialTiktok" type="url" defaultValue={settings.socialTiktok} placeholder="https://tiktok.com/@..." />
      </Card>

      {/* Fiscal / legal */}
      <Card title="Moneda, impuestos y legal">
        <Field label="Moneda (ISO 4217)" name="currency" defaultValue={settings.currency} placeholder="PEN" required />
        <Field label="Locale" name="locale" defaultValue={settings.locale} placeholder="es-PE" required />
        <Field label="País (ISO)" name="country" defaultValue={settings.country} placeholder="PE" required />
        <Field label="Etiqueta de precio" name="priceLabel" defaultValue={settings.priceLabel} placeholder="Precio incluye impuestos" required />
        <div className="sm:col-span-2">
          <Field label="Nota de precio" name="priceNote" defaultValue={settings.priceNote} required />
        </div>
        <div className="sm:col-span-2">
          <Field label="Titular legal (política de privacidad)" name="legalEntity" defaultValue={settings.legalEntity} />
        </div>
      </Card>

      {/* Barra de acción */}
      <div className="sticky bottom-0 flex items-center justify-between gap-3 rounded-2xl border border-steel-200 bg-white/95 px-5 py-4 backdrop-blur">
        <div className="text-sm">
          {state.error ? <span className="text-red-600">{state.error}</span> : null}
          {state.ok ? <span className="text-green-600">✓ Configuración guardada.</span> : null}
        </div>
        <button
          type="submit"
          disabled={pending}
          className="rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
        >
          {pending ? "Guardando…" : "Guardar cambios"}
        </button>
      </div>
    </form>
  );
}
