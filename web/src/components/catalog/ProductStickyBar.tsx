"use client";

import { useEffect, useRef, useState } from "react";
import { formatPrice } from "@/lib/utils";
import { trackWhatsappQuestion } from "@/lib/analytics";

type Props = {
  targetId: string;
  productId: string;
  name: string;
  price: number;
  currency: string;
  locale: string;
  whatsappHref: string | null;
};

// Barra fija inferior (DESIGN-producto.md §3.6): aparece solo cuando el
// panel de compra principal sale del viewport al hacer scroll, para que
// el CTA nunca quede "perdido" en una ficha larga.
export function ProductStickyBar({ targetId, productId, name, price, currency, locale, whatsappHref }: Props) {
  const [visible, setVisible] = useState(false);
  const observedRef = useRef<Element | null>(null);

  useEffect(() => {
    const el = document.getElementById(targetId);
    if (!el) return;
    observedRef.current = el;
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(!entry.isIntersecting),
      { threshold: 0 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [targetId]);

  if (!whatsappHref) return null;

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-30 border-t border-steel-200 bg-white/95 backdrop-blur-sm shadow-[0_-4px_16px_rgba(20,24,28,0.08)] transition-transform duration-200 ${
        visible ? "translate-y-0" : "translate-y-full"
      }`}
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-2.5">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-steel-900">{name}</p>
          <p className="font-mono text-base font-bold text-steel-900">
            {formatPrice(price, currency, locale)}
          </p>
        </div>
        <a
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackWhatsappQuestion({ id: productId, name, price }, currency)}
          className="flex shrink-0 items-center gap-2 rounded-xl bg-whatsapp px-5 py-3 text-sm font-semibold text-white transition hover:bg-whatsapp-dark"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden>
            <path d="M17.47 14.38c-.29-.15-1.71-.84-1.97-.94-.26-.1-.46-.15-.65.15-.19.29-.75.94-.92 1.13-.17.19-.34.22-.63.07-.29-.15-1.22-.45-2.33-1.43-.86-.77-1.44-1.72-1.61-2.01-.17-.29-.02-.45.13-.59.13-.13.29-.34.44-.51.15-.17.19-.29.29-.48.1-.19.05-.36-.02-.51-.07-.15-.65-1.57-.89-2.15-.24-.57-.48-.49-.65-.5-.17-.01-.36-.01-.55-.01-.19 0-.51.07-.77.36-.26.29-1.01.99-1.01 2.41 0 1.42 1.03 2.79 1.18 2.98.15.19 2.03 3.1 4.92 4.35.69.3 1.22.47 1.64.6.69.22 1.31.19 1.81.12.55-.08 1.71-.7 1.95-1.37.24-.67.24-1.25.17-1.37-.07-.12-.26-.19-.55-.34zM12.04 2.5A9.5 9.5 0 0 0 2.55 12c0 1.67.44 3.31 1.27 4.75L2.5 21.5l4.87-1.28A9.46 9.46 0 0 0 12.04 21.5 9.5 9.5 0 0 0 21.5 12 9.5 9.5 0 0 0 12.04 2.5z" />
          </svg>
          <span className="hidden sm:inline">Preguntar por WhatsApp</span>
          <span className="sm:hidden">WhatsApp</span>
        </a>
      </div>
    </div>
  );
}
