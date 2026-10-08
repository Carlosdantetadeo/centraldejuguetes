"use client";

import { useEffect, useState, type MouseEvent } from "react";
import { useCart } from "@/components/cart/CartProvider";
import { trackAddToCart } from "@/lib/analytics";

type Props = {
  id: string;
  categorySlug: string;
  productSlug: string;
  name: string;
  sku?: string | null;
  price: number;
  currency: string;
  image?: string | null;
};

// Acción rápida opcional en la grilla (H-04): agrega 1 unidad a la
// cotización sin salir de la card. stopPropagation evita disparar el
// <Link> que cubre toda la tarjeta; el link principal sigue intacto.
export function QuickAddButton({ id, categorySlug, productSlug, name, sku, price, currency, image }: Props) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);

  useEffect(() => {
    if (!added) return;
    const t = setTimeout(() => setAdded(false), 1600);
    return () => clearTimeout(t);
  }, [added]);

  function handleClick(e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    addItem({
      key: `${categorySlug}/${productSlug}`,
      id,
      categorySlug,
      productSlug,
      name,
      sku,
      price,
      image,
      sizes: [{ size: "Unidad", qty: 1 }],
    });
    trackAddToCart({ id, name, price, quantity: 1 }, currency);
    setAdded(true);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={`Agregar ${name} a la cotización`}
      className={`pointer-events-auto absolute bottom-2 right-2 z-10 flex h-9 w-9 items-center justify-center rounded-full shadow-md transition-all ${
        added ? "bg-emerald-600 text-white" : "bg-white text-brand-700 ring-1 ring-steel-200 hover:bg-brand-600 hover:text-white"
      }`}
    >
      {added ? (
        <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current stroke-2" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current stroke-2" aria-hidden>
          <path strokeLinecap="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
      )}
    </button>
  );
}
