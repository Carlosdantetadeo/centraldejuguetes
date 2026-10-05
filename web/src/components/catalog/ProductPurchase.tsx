"use client";

import { useEffect, useState } from "react";
import { useCart } from "@/components/cart/CartProvider";

type Props = {
  id: string;
  sizes: string[];
  categorySlug: string;
  productSlug: string;
  name: string;
  sku?: string | null;
  price: number;
  image?: string | null;
};

export function ProductPurchase({
  id,
  sizes,
  categorySlug,
  productSlug,
  name,
  sku,
  price,
  image,
}: Props) {
  const { addItem, items, openCart } = useCart();
  const hasSizes = sizes.length > 0;

  // Estado para modo tallas (ropa)
  const [sizeQty, setSizeQty] = useState<Record<string, number>>({});

  // Estado para modo unidad/docena (juguetes sin tallas)
  const [unitType, setUnitType] = useState<"unidad" | "docena">("unidad");
  const [simpleQty, setSimpleQty] = useState(1);

  const [added, setAdded] = useState(false);

  useEffect(() => {
    if (!added) return;
    const t = setTimeout(() => setAdded(false), 2200);
    return () => clearTimeout(t);
  }, [added]);

  // Lógica modo tallas
  const setSizeAmount = (size: string, value: number) =>
    setSizeQty((prev) => ({ ...prev, [size]: Math.max(0, value) }));
  const chosen = sizes
    .map((size) => ({ size, qty: sizeQty[size] ?? 0 }))
    .filter((s) => s.qty > 0);
  const totalPares = chosen.reduce((n, s) => n + s.qty, 0);

  const canAdd = hasSizes ? chosen.length > 0 : simpleQty > 0;

  const handleAdd = () => {
    if (!canAdd) return;
    const sizesData = hasSizes
      ? chosen
      : [{ size: unitType === "docena" ? "Docena (×12)" : "Unidad", qty: simpleQty }];

    addItem({
      key: `${categorySlug}/${productSlug}`,
      id,
      categorySlug,
      productSlug,
      name,
      sku,
      price,
      image,
      sizes: sizesData,
    });
    setAdded(true);
    if (hasSizes) setSizeQty({});
    else setSimpleQty(1);
  };

  return (
    <div className="space-y-5">
      {/* ── Selector de tallas (modo ropa) ── */}
      {hasSizes && (
        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-semibold text-steel-900">
              Elige tallas y cantidades
            </span>
            {chosen.length > 0 && (
              <button
                type="button"
                onClick={() => setSizeQty({})}
                className="text-xs font-medium text-steel-500 underline-offset-2 hover:text-brand-700 hover:underline"
              >
                Limpiar
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {sizes.map((size) => {
              const value = sizeQty[size] ?? 0;
              const active = value > 0;
              return (
                <div
                  key={size}
                  className={`flex items-center justify-between rounded-xl border px-2.5 py-1.5 transition-colors ${
                    active ? "border-brand-500 bg-brand-50" : "border-steel-200 bg-white"
                  }`}
                >
                  <span className="text-sm font-semibold text-steel-800">{size}</span>
                  {active ? (
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setSizeAmount(size, value - 1)}
                        aria-label={`Quitar una unidad de la talla ${size}`}
                        className="flex h-7 w-7 items-center justify-center rounded-lg border border-steel-200 bg-white text-steel-600 hover:border-brand-300 hover:text-brand-700"
                      >
                        <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current stroke-2" aria-hidden>
                          <path strokeLinecap="round" d="M5 12h14" />
                        </svg>
                      </button>
                      <span className="w-5 text-center text-sm font-bold tabular-nums text-steel-900">
                        {value}
                      </span>
                      <button
                        type="button"
                        onClick={() => setSizeAmount(size, value + 1)}
                        aria-label={`Agregar una unidad de la talla ${size}`}
                        className="flex h-7 w-7 items-center justify-center rounded-lg border border-brand-600 bg-brand-600 text-white hover:bg-brand-700"
                      >
                        <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current stroke-2" aria-hidden>
                          <path strokeLinecap="round" d="M12 5v14m7-7H5" />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setSizeAmount(size, 1)}
                      className="flex h-7 items-center gap-1 rounded-lg border border-steel-200 bg-white px-2 text-xs font-semibold text-brand-700 hover:border-brand-300"
                    >
                      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-none stroke-current stroke-2" aria-hidden>
                        <path strokeLinecap="round" d="M12 5v14m7-7H5" />
                      </svg>
                      Agregar
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          <p className="mt-2 text-xs text-steel-500">
            {chosen.length > 0
              ? `Seleccionado: ${chosen.map((s) => `${s.size} ×${s.qty}`).join(", ")} · ${totalPares} ${totalPares === 1 ? "par" : "pares"}`
              : "Elige la cantidad de cada talla que quieras cotizar."}
          </p>
        </div>
      )}

      {/* ── Selector de cantidad unidad / docena (modo juguetes) ── */}
      {!hasSizes && (
        <div>
          <p className="mb-2 text-sm font-semibold text-steel-900">Cantidad a cotizar</p>

          {/* Tabs unidad / docena */}
          <div className="mb-3 flex gap-2">
            {(["unidad", "docena"] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => { setUnitType(type); setSimpleQty(1); }}
                className={`flex-1 rounded-xl border py-2 text-sm font-semibold transition-colors ${
                  unitType === type
                    ? "border-brand-500 bg-brand-50 text-brand-700"
                    : "border-steel-200 bg-white text-steel-600 hover:border-brand-300"
                }`}
              >
                {type === "unidad" ? "Unidad" : "Docena (×12)"}
              </button>
            ))}
          </div>

          {/* Contador +/- */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSimpleQty((q) => Math.max(1, q - 1))}
              aria-label="Disminuir cantidad"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-steel-200 text-steel-600 transition-colors hover:border-brand-300 hover:text-brand-700"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current stroke-2" aria-hidden>
                <path strokeLinecap="round" d="M5 12h14" />
              </svg>
            </button>
            <span className="w-10 text-center text-2xl font-bold tabular-nums text-steel-900">
              {simpleQty}
            </span>
            <button
              type="button"
              onClick={() => setSimpleQty((q) => q + 1)}
              aria-label="Aumentar cantidad"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-brand-600 bg-brand-600 text-white transition-colors hover:bg-brand-700"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current stroke-2" aria-hidden>
                <path strokeLinecap="round" d="M12 5v14m7-7H5" />
              </svg>
            </button>
            <span className="text-sm text-steel-500">
              {unitType === "docena"
                ? `= ${simpleQty * 12} unidades`
                : simpleQty === 1
                  ? "unidad"
                  : "unidades"}
            </span>
          </div>
        </div>
      )}

      <div className="space-y-2.5">
        <button
          type="button"
          onClick={handleAdd}
          disabled={!canAdd}
          className={`flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-base font-semibold transition-all ${
            added
              ? "bg-emerald-600 text-white"
              : canAdd
                ? "bg-brand-600 text-white shadow-lg shadow-brand-600/20 hover:bg-brand-700 hover:shadow-xl"
                : "cursor-not-allowed bg-steel-200 text-steel-400"
          }`}
        >
          {added ? (
            <>
              <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-2" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
              ¡Agregado a tu cotización!
            </>
          ) : (
            <>
              <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-2" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Agregar a la cotización
            </>
          )}
        </button>

        {hasSizes && !canAdd && (
          <p className="text-center text-xs text-steel-400">
            Elige la cantidad de al menos una talla para agregar.
          </p>
        )}

        {items.length > 0 && (
          <button
            type="button"
            onClick={openCart}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-whatsapp bg-whatsapp/5 px-6 py-3 text-sm font-semibold text-whatsapp-dark transition-all hover:bg-whatsapp/10"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden>
              <path d="M17.47 14.38c-.29-.15-1.71-.84-1.97-.94-.26-.1-.46-.15-.65.15-.19.29-.75.94-.92 1.13-.17.19-.34.22-.63.07-.29-.15-1.22-.45-2.33-1.43-.86-.77-1.44-1.72-1.61-2.01-.17-.29-.02-.45.13-.59.13-.13.29-.34.44-.51.15-.17.19-.29.29-.48.1-.19.05-.36-.02-.51-.07-.15-.65-1.57-.89-2.15-.24-.57-.48-.49-.65-.5-.17-.01-.36-.01-.55-.01-.19 0-.51.07-.77.36-.26.29-1.01.99-1.01 2.41 0 1.42 1.03 2.79 1.18 2.98.15.19 2.03 3.1 4.92 4.35.69.3 1.22.47 1.64.6.69.22 1.31.19 1.81.12.55-.08 1.71-.7 1.95-1.37.24-.67.24-1.25.17-1.37-.07-.12-.26-.19-.55-.34zM12.04 2.5A9.5 9.5 0 0 0 2.55 12c0 1.67.44 3.31 1.27 4.75L2.5 21.5l4.87-1.28A9.46 9.46 0 0 0 12.04 21.5 9.5 9.5 0 0 0 21.5 12 9.5 9.5 0 0 0 12.04 2.5z" />
            </svg>
            Ver mi cotización ({items.length}) y enviar
          </button>
        )}
      </div>
    </div>
  );
}
