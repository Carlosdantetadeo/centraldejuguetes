"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { bulkUpdateStockAction } from "@/app/admin/actions";

export function BulkStockPriceUpdate() {
  const [csvText, setCsvText] = useState("");
  const [result, setResult] = useState<{ updated: number; errors: string[] } | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setCsvText(reader.result as string);
    };
    reader.readAsText(file);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!csvText.trim()) return;
    setLoading(true);
    setError("");
    setResult(null);

    const formData = new FormData();
    formData.set("csv", csvText);

    const res = await bulkUpdateStockAction(formData);
    setLoading(false);

    if (res && "error" in res && res.error) {
      setError(res.error);
    } else if (res && "updated" in res) {
      setResult(res as { updated: number; errors: string[] });
      setCsvText("");
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  const template = `sku,stock,price
55605,25,59.90
55495,0,37.70`;

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-steel-500">
        <Link href="/admin/productos" className="hover:text-steel-700">Productos</Link>
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
        <span className="text-steel-900">Actualizar stock y precio</span>
      </nav>

      <div>
        <h1 className="text-2xl font-bold text-steel-900">Actualizar stock y precio en bloque</h1>
        <p className="mt-1 text-steel-600">
          Sube un CSV con el código (SKU) de cada producto para actualizar su stock y/o precio. No crea productos nuevos — solo actualiza los que ya existen.
        </p>
      </div>

      {/* Instrucciones */}
      <div className="rounded-2xl border border-steel-200 bg-white p-6">
        <div className="mb-4 flex items-center gap-2">
          <svg className="h-5 w-5 text-steel-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2 className="text-sm font-semibold text-steel-900">Formato del CSV</h2>
        </div>
        <p className="mb-3 text-sm text-steel-600">
          Columna requerida: <code className="rounded bg-steel-100 px-1.5 py-0.5 text-xs">sku</code> (el código del producto, tal como aparece en su ficha).
          Trae al menos una de <code className="rounded bg-steel-100 px-1.5 py-0.5 text-xs">stock</code> o <code className="rounded bg-steel-100 px-1.5 py-0.5 text-xs">price</code> — si dejas una celda vacía en una fila, ese campo no se toca para ese producto.
        </p>
        <div className="overflow-x-auto rounded-xl bg-steel-900 p-4">
          <pre className="text-xs text-steel-200">{template}</pre>
        </div>
        <div className="mt-3 flex gap-3">
          <button
            onClick={() => setCsvText(template)}
            className="rounded-lg border border-steel-200 px-3 py-2 text-xs font-medium text-steel-700 transition hover:bg-steel-50"
          >
            Usar ejemplo
          </button>
          <button
            onClick={() => {
              const blob = new Blob([template], { type: "text/csv" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = "plantilla-stock-precio.csv";
              a.click();
              URL.revokeObjectURL(url);
            }}
            className="rounded-lg border border-steel-200 px-3 py-2 text-xs font-medium text-steel-700 transition hover:bg-steel-50"
          >
            Descargar plantilla
          </button>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="rounded-2xl border border-steel-200 bg-white p-6">
        <div className="mb-4">
          <label htmlFor="file" className="mb-2 block text-sm font-medium text-steel-700">
            Archivo CSV
          </label>
          <input
            ref={fileRef}
            id="file"
            type="file"
            accept=".csv,text/csv"
            onChange={handleFile}
            className="block w-full text-sm text-steel-600 file:mr-4 file:rounded-lg file:border-0 file:bg-brand-600 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-brand-700"
          />
        </div>

        <div>
          <label htmlFor="csv" className="mb-2 block text-sm font-medium text-steel-700">
            O pega el contenido CSV directamente
          </label>
          <textarea
            id="csv"
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
            rows={8}
            placeholder="sku,stock,price"
            className="w-full rounded-xl border border-steel-200 bg-white px-4 py-3 font-mono text-xs text-steel-900 placeholder-steel-400 outline-none ring-brand-500 focus:ring-2"
          />
        </div>

        {error ? (
          <div className="mt-4 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </div>
        ) : null}

        {result ? (
          <div className="mt-4 space-y-3">
            <div className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
              <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              {result.updated} producto{result.updated !== 1 ? "s" : ""} actualizado{result.updated !== 1 ? "s" : ""} correctamente.
            </div>
            {result.errors.length > 0 ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                <p className="mb-2 font-medium">Errores ({result.errors.length}):</p>
                <ul className="space-y-1 text-xs">
                  {result.errors.map((err, i) => (
                    <li key={i}>• {err}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="mt-5 flex items-center gap-3">
          <button
            type="submit"
            disabled={loading || !csvText.trim()}
            className="flex items-center gap-2 rounded-xl bg-brand-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
          >
            {loading ? (
              <>
                <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Actualizando…
              </>
            ) : (
              <>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                Actualizar productos
              </>
            )}
          </button>
          <Link
            href="/admin/productos"
            className="rounded-xl border border-steel-200 bg-white px-6 py-3 text-sm font-medium text-steel-700 transition hover:bg-steel-50"
          >
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  );
}
