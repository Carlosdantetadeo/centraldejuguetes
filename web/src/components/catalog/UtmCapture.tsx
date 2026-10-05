"use client";

import { useEffect } from "react";
import { captureUtmFromUrl } from "@/lib/utm";

// No renderiza nada — solo captura utm_source/medium/campaign + fbclid/
// gclid de la URL de la primera visita (prompt-frontend §8).
export function UtmCapture() {
  useEffect(() => {
    captureUtmFromUrl(window.location.search);
  }, []);
  return null;
}
