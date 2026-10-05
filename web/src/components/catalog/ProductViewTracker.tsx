"use client";

import { useEffect } from "react";
import { trackViewItem } from "@/lib/analytics";

type Props = {
  productId: string;
  name: string;
  price: number;
  currency: string;
};

// US-14: registra una vista al montar la ficha. Fire-and-forget — no bloquea
// el render ni depende de la caché ISR de la página. `keepalive` permite que la
// petición sobreviva si el visitante navega de inmediato. También dispara el
// evento view_item de GA4/Meta Pixel (prompt-frontend §8).
export function ProductViewTracker({ productId, name, price, currency }: Props) {
  useEffect(() => {
    fetch(`/api/producto/${productId}/vista`, {
      method: "POST",
      keepalive: true,
    }).catch(() => {
      // Silencioso: un contador de analítica no debe generar errores visibles.
    });
    trackViewItem({ id: productId, name, price }, currency);
  }, [productId, name, price, currency]);

  return null;
}
