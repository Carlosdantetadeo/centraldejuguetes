"use client";

import { useState } from "react";

type CategoryOption = {
  id: string;
  name: string;
};

type ProductFormProps = {
  categories: CategoryOption[];
  action: (formData: FormData) => Promise<{ error?: string } | void>;
  initialValues?: {
    id?: string;
    name?: string;
    slug?: string;
    description?: string | null;
    brand?: string | null;
    ageMin?: number | null;
    ageMax?: number | null;
    safetyWarnings?: string | null;
    batteriesIncluded?: boolean | null;
    boxContents?: string | null;
    videoUrl?: string | null;
    measure?: string | null;
    gauge?: string | null;
    material?: string | null;
    price?: number;
    compareAtPrice?: number | null;
    priceTiers?: unknown;
    stock?: number;
    available?: boolean;
    featured?: boolean;
    categoryId?: string;
  };
};

type TierRow = { label: string; amount: string };

function initialTiers(value: unknown): TierRow[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((t): t is { label: unknown; amount: unknown } => typeof t === "object" && t !== null)
    .map((t) => ({ label: String(t.label ?? ""), amount: String(t.amount ?? "") }));
}

export function ProductForm({ categories, action, initialValues }: ProductFormProps) {
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [tiers, setTiers] = useState<TierRow[]>(() => initialTiers(initialValues?.priceTiers));

  const tiersJson = JSON.stringify(
    tiers
      .filter((t) => t.label.trim() !== "" && t.amount.trim() !== "")
      .map((t) => ({ label: t.label.trim(), amount: Number(t.amount) })),
  );

  async function handleAction(formData: FormData) {
    setError("");
    setPending(true);
    const result = await action(formData);
    setPending(false);
    if (result?.error) setError(result.error);
  }

  return (
    <form action={handleAction} className="space-y-6">
      {initialValues?.id ? (
        <input type="hidden" name="productId" value={initialValues.id} />
      ) : null}

      {/* Sección: Información básica */}
      <div className="rounded-2xl border border-steel-200 bg-white p-6">
        <div className="mb-5 flex items-center gap-2">
          <svg className="h-5 w-5 text-steel-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h2 className="text-sm font-semibold text-steel-900">Información básica</h2>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <Field label="Nombre del producto" name="name" defaultValue={initialValues?.name} required />
          <Field
            label="Código URL (opcional)"
            name="slug"
            defaultValue={initialValues?.slug ?? ""}
            hint="Se genera automáticamente si lo dejas vacío"
          />
        </div>

        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <Field
            label="Descripción"
            name="description"
            defaultValue={initialValues?.description ?? ""}
            textarea
          />
          <Field
            label="Marca (opcional)"
            name="brand"
            defaultValue={initialValues?.brand ?? ""}
            placeholder="Ej: Melissa & Doug"
            hint="Necesaria para que el producto entre en el feed de ChatGPT Shopping"
          />
        </div>
      </div>

      {/* Sección: Especificaciones técnicas */}
      <div className="rounded-2xl border border-steel-200 bg-white p-6">
        <div className="mb-5 flex items-center gap-2">
          <svg className="h-5 w-5 text-steel-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.712 1.712 0 002.137 1.072c1.756-.426 2.924 1.756 1.072 2.137a1.712 1.712 0 001.072 2.137c.426 1.756-1.756 2.924-2.137 1.072a1.712 1.712 0 00-2.137-1.072c-1.756.426-2.924-1.756-1.072-2.137a1.712 1.712 0 00-1.072-2.137z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <h2 className="text-sm font-semibold text-steel-900">Especificaciones técnicas</h2>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          <Field label="Medida" name="measure" defaultValue={initialValues?.measure ?? ""} placeholder="Ej: 2m x 50m" />
          <Field label="Calibre" name="gauge" defaultValue={initialValues?.gauge ?? ""} placeholder="Ej: 200 galgas" />
          <Field label="Material" name="material" defaultValue={initialValues?.material ?? ""} placeholder="Ej: Polietileno" />
        </div>

        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <Field
            label="Edad mínima recomendada (años, opcional)"
            name="ageMin"
            type="number"
            defaultValue={initialValues?.ageMin?.toString() ?? ""}
            placeholder="Ej: 3"
            hint="Habilita guías por edad y el schema de audiencia para buscadores/IA"
          />
          <Field
            label="Edad máxima recomendada (años, opcional)"
            name="ageMax"
            type="number"
            defaultValue={initialValues?.ageMax?.toString() ?? ""}
            placeholder="Ej: 6"
          />
        </div>
      </div>

      {/* Sección: Seguridad y contenido (ficha de producto) */}
      <div className="rounded-2xl border border-steel-200 bg-white p-6">
        <div className="mb-5 flex items-center gap-2">
          <svg className="h-5 w-5 text-steel-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2 className="text-sm font-semibold text-steel-900">Seguridad y contenido</h2>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label htmlFor="batteriesIncluded" className="mb-1.5 block text-sm font-medium text-steel-700">
              ¿Incluye pilas?
            </label>
            <select
              id="batteriesIncluded"
              name="batteriesIncluded"
              defaultValue={
                initialValues?.batteriesIncluded === true
                  ? "true"
                  : initialValues?.batteriesIncluded === false
                    ? "false"
                    : ""
              }
              className="w-full rounded-xl border border-steel-200 bg-white px-4 py-3 text-sm text-steel-900 outline-none ring-brand-500 focus:ring-2"
            >
              <option value="">No especificado</option>
              <option value="true">Sí, incluye pilas</option>
              <option value="false">No incluye pilas</option>
            </select>
          </div>
          <Field
            label="Video corto (URL, opcional)"
            name="videoUrl"
            defaultValue={initialValues?.videoUrl ?? ""}
            placeholder="https://..."
          />
        </div>

        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <Field
            label="Advertencias de seguridad (opcional)"
            name="safetyWarnings"
            defaultValue={initialValues?.safetyWarnings ?? ""}
            placeholder="Ej: Contiene piezas pequeñas. No apto para menores de 3 años."
            textarea
          />
          <Field
            label="Contenido de la caja (opcional)"
            name="boxContents"
            defaultValue={initialValues?.boxContents ?? ""}
            placeholder="Ej: 1 cocina de madera, 3 ollas, 2 utensilios"
            textarea
          />
        </div>
      </div>

      {/* Sección: Precios */}
      <div className="rounded-2xl border border-steel-200 bg-white p-6">
        <div className="mb-5 flex items-center gap-2">
          <svg className="h-5 w-5 text-steel-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2 className="text-sm font-semibold text-steel-900">Precios (incluyen impuestos)</h2>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          <Field
            label="Precio general (S/)"
            name="price"
            type="number"
            step="0.01"
            defaultValue={initialValues?.price?.toString() ?? "0"}
            required
            placeholder="0.00"
            hint="Precio de referencia principal"
          />
          <Field
            label="Precio tachado / antes del descuento (S/)"
            name="compareAtPrice"
            type="number"
            step="0.01"
            defaultValue={initialValues?.compareAtPrice?.toString() ?? ""}
            placeholder="Dejar vacío = sin descuento"
            hint="Si es mayor al precio general, la ficha muestra el descuento"
          />
          <Field
            label="Stock (unidades)"
            name="stock"
            type="number"
            defaultValue={initialValues?.stock?.toString() ?? "0"}
            required
          />
        </div>

        <div className="mt-5 rounded-xl bg-steel-50 p-4">
          <div className="mb-1 flex items-center justify-between">
            <p className="text-xs font-medium text-steel-600">Precios por unidad de venta (opcional)</p>
          </div>
          <p className="mb-4 text-xs text-steel-400">
            Agregá los precios que quieras: por rollo, por metro, por ciento, por millar… cada uno con su etiqueta.
          </p>

          {/* Se envía como JSON en un input oculto */}
          <input type="hidden" name="priceTiers" value={tiersJson} />

          <div className="space-y-3">
            {tiers.map((tier, i) => (
              <div key={i} className="flex items-end gap-2">
                <label className="flex-1">
                  <span className="mb-1 block text-xs font-medium text-steel-600">Etiqueta</span>
                  <input
                    type="text"
                    value={tier.label}
                    onChange={(e) =>
                      setTiers((prev) => prev.map((t, j) => (j === i ? { ...t, label: e.target.value } : t)))
                    }
                    placeholder="Ej: Por rollo (50m)"
                    className="w-full rounded-lg border border-steel-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </label>
                <label className="w-32">
                  <span className="mb-1 block text-xs font-medium text-steel-600">Precio (S/)</span>
                  <input
                    type="number"
                    step="0.01"
                    value={tier.amount}
                    onChange={(e) =>
                      setTiers((prev) => prev.map((t, j) => (j === i ? { ...t, amount: e.target.value } : t)))
                    }
                    placeholder="0.00"
                    className="w-full rounded-lg border border-steel-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </label>
                <button
                  type="button"
                  onClick={() => setTiers((prev) => prev.filter((_, j) => j !== i))}
                  aria-label="Quitar precio"
                  className="mb-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-steel-200 text-steel-400 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setTiers((prev) => [...prev, { label: "", amount: "" }])}
            className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-dashed border-steel-300 px-3 py-2 text-sm font-medium text-steel-600 transition hover:border-brand-400 hover:text-brand-700"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Agregar precio por unidad
          </button>
        </div>
      </div>

      {/* Sección: Categoría y visibilidad */}
      <div className="rounded-2xl border border-steel-200 bg-white p-6">
        <div className="mb-5 flex items-center gap-2">
          <svg className="h-5 w-5 text-steel-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
          </svg>
          <h2 className="text-sm font-semibold text-steel-900">Categoría y visibilidad</h2>
        </div>

        <div className="mb-5">
          <label htmlFor="categoryId" className="mb-1.5 block text-sm font-medium text-steel-700">
            Categoría <span className="text-brand-600">*</span>
          </label>
          <select
            id="categoryId"
            name="categoryId"
            defaultValue={initialValues?.categoryId ?? ""}
            required
            className="w-full rounded-xl border border-steel-200 bg-white px-4 py-3 text-sm text-steel-900 outline-none ring-brand-500 focus:ring-2"
          >
            <option value="" disabled>
              Selecciona una categoría
            </option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap gap-6">
          <label className="flex cursor-pointer items-center gap-2.5 text-sm text-steel-700">
            <input
              type="checkbox"
              name="available"
              defaultChecked={initialValues?.available ?? true}
              className="h-4 w-4 rounded border-steel-300 text-brand-600 focus:ring-brand-500"
            />
            Disponible para venta
          </label>
          <label className="flex cursor-pointer items-center gap-2.5 text-sm text-steel-700">
            <input
              type="checkbox"
              name="featured"
              defaultChecked={initialValues?.featured ?? false}
              className="h-4 w-4 rounded border-steel-300 text-brand-600 focus:ring-brand-500"
            />
            Destacado en home
          </label>
        </div>
      </div>

      {/* Error */}
      {error ? (
        <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </div>
      ) : null}

      {/* Botón */}
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="flex items-center gap-2 rounded-xl bg-brand-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
        >
          {pending ? (
            <>
              <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Guardando…
            </>
          ) : (
            <>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Guardar producto
            </>
          )}
        </button>
        <a
          href="/admin/productos"
          className="rounded-xl border border-steel-200 bg-white px-6 py-3 text-sm font-medium text-steel-700 transition hover:bg-steel-50"
        >
          Cancelar
        </a>
      </div>
    </form>
  );
}

function Field({
  label,
  name,
  defaultValue,
  required,
  type = "text",
  step,
  hint,
  placeholder,
  textarea,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  required?: boolean;
  type?: string;
  step?: string;
  hint?: string;
  placeholder?: string;
  textarea?: boolean;
}) {
  return (
    <div>
      <label htmlFor={name} className="mb-1.5 block text-sm font-medium text-steel-700">
        {label}
        {required ? <span className="ml-1 text-brand-600">*</span> : null}
      </label>
      {textarea ? (
        <textarea
          id={name}
          name={name}
          defaultValue={defaultValue}
          rows={4}
          placeholder={placeholder}
          className="w-full rounded-xl border border-steel-200 bg-white px-4 py-3 text-sm text-steel-900 placeholder-steel-400 outline-none ring-brand-500 focus:ring-2"
        />
      ) : (
        <input
          id={name}
          name={name}
          type={type}
          step={step}
          defaultValue={defaultValue}
          required={required}
          placeholder={placeholder}
          className="w-full rounded-xl border border-steel-200 bg-white px-4 py-3 text-sm text-steel-900 placeholder-steel-400 outline-none ring-brand-500 focus:ring-2"
        />
      )}
      {hint ? <p className="mt-1 text-xs text-steel-500">{hint}</p> : null}
    </div>
  );
}
