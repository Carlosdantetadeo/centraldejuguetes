"use client";

import { FormEvent, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type ImageUploaderProps = {
  productId: string;
  productName: string;
};

export function ImageUploader({ productId, productName }: ImageUploaderProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [altText, setAltText] = useState(`${productName} - foto de producto`);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setPreview(URL.createObjectURL(file));
    } else {
      setPreview(null);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    const form = event.currentTarget;
    const formData = new FormData(form);
    formData.set("productId", productId);
    formData.set("altText", altText);

    try {
      const response = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "No se pudo subir la imagen.");
        setLoading(false);
        return;
      }

      setMessage("Imagen subida correctamente. Ya aparece abajo.");
      form.reset();
      setPreview(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      router.refresh();
    } catch {
      setError("Error de conexión. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} encType="multipart/form-data" className="space-y-4">
      {/* Drop zone */}
      <div className="relative rounded-xl border-2 border-dashed border-steel-200 px-6 py-8 text-center transition hover:border-brand-300 hover:bg-brand-50/30">
        {preview ? (
          <div className="mb-3 inline-block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="Vista previa" className="mx-auto h-32 w-32 rounded-lg object-cover" />
          </div>
        ) : (
          <svg className="mx-auto mb-3 h-10 w-10 text-steel-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
        )}

        <input
          ref={fileInputRef}
          id="file"
          name="file"
          type="file"
          accept="image/*"
          capture="environment"
          required
          onChange={handleFileChange}
          className="block w-full text-sm text-steel-600 file:mr-4 file:rounded-lg file:border-0 file:bg-brand-600 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-brand-700"
        />
        <p className="mt-2 text-xs text-steel-400">
          Se optimiza automáticamente a WebP con miniaturas
        </p>
      </div>

      {/* Alt text */}
      <div>
        <label htmlFor="altText" className="mb-1.5 block text-sm font-medium text-steel-700">
          Descripción de la imagen (alt)
        </label>
        <input
          id="altText"
          name="altText"
          value={altText}
          onChange={(event) => setAltText(event.target.value)}
          required
          minLength={3}
          className="w-full rounded-xl border border-steel-200 bg-white px-4 py-3 text-sm text-steel-900 outline-none ring-brand-500 focus:ring-2"
        />
      </div>

      {/* Feedback */}
      {error ? (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </div>
      ) : null}
      {message ? (
        <div className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          {message}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={loading}
        className="flex items-center gap-2 rounded-xl bg-steel-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-steel-800 disabled:opacity-60"
      >
        {loading ? (
          <>
            <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Subiendo…
          </>
        ) : (
          <>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            Subir imagen
          </>
        )}
      </button>
    </form>
  );
}
