"use client";

import { useEffect } from "react";

// US-14: registra una vista al montar la ficha. Fire-and-forget — no bloquea
// el render ni depende de la caché ISR de la página. `keepalive` permite que la
// petición sobreviva si el visitante navega de inmediato.
export function ProductViewTracker({ productId }: { productId: string }) {
  useEffect(() => {
    fetch(`/api/producto/${productId}/vista`, {
      method: "POST",
      keepalive: true,
    }).catch(() => {
      // Silencioso: un contador de analítica no debe generar errores visibles.
    });
  }, [productId]);

  return null;
}
