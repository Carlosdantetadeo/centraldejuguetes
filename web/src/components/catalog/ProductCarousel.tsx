"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";

export function ProductCarousel({
  title,
  viewAllHref,
  children,
}: {
  title: string;
  viewAllHref?: string;
  children: React.ReactNode;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 8);
    setCanRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 8);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    checkScroll();
    el.addEventListener("scroll", checkScroll, { passive: true });
    window.addEventListener("resize", checkScroll, { passive: true });
    return () => {
      el.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
    };
  }, [checkScroll]);

  function scroll(dir: "left" | "right") {
    const el = scrollRef.current;
    if (!el) return;
    // Avanza una "página" completa (el ancho visible), para que siempre
    // quede un número entero de fichas a la vista — nunca una a la mitad.
    el.scrollBy({ left: dir === "right" ? el.clientWidth : -el.clientWidth, behavior: "smooth" });
  }

  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <h2 className="shrink-0 font-display text-lg font-extrabold uppercase tracking-wide text-steel-900 sm:text-xl">
          {title}
        </h2>

        {/* Línea que conecta el título con las flechas — indica "hay más" sin cortar una ficha */}
        <div className="h-px min-w-6 flex-1 bg-steel-200" aria-hidden="true" />

        <div className="flex shrink-0 items-center gap-3">
          {viewAllHref && (
            <Link
              href={viewAllHref}
              className="inline-flex items-center gap-1 text-sm font-semibold text-brand-600 hover:text-brand-700 hover:underline"
            >
              Ver todo
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-none stroke-current stroke-2" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </Link>
          )}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => scroll("left")}
              disabled={!canLeft}
              aria-label="Anterior"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-steel-200 bg-white text-steel-600 transition-colors hover:border-brand-300 hover:text-brand-700 disabled:opacity-30 disabled:hover:border-steel-200 disabled:hover:text-steel-600"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current stroke-2" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
              </svg>
            </button>
            <button
              onClick={() => scroll("right")}
              disabled={!canRight}
              aria-label="Siguiente"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-steel-200 bg-white text-steel-600 transition-colors hover:border-brand-300 hover:text-brand-700 disabled:opacity-30 disabled:hover:border-steel-200 disabled:hover:text-steel-600"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current stroke-2" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Grid con columnas calculadas para que siempre quepa un número
         entero de fichas (2 en mobile, 3 en tablet, 4 en desktop) — nunca
         una ficha cortada a la mitad en el borde. */}
      <div
        ref={scrollRef}
        className="grid grid-flow-col auto-cols-[calc((100%-0.75rem)/2)] gap-3 overflow-x-auto pb-1 [scroll-snap-type:x_mandatory] [scrollbar-width:none] sm:auto-cols-[calc((100%-2*1rem)/3)] sm:gap-4 lg:auto-cols-[calc((100%-3*1rem)/4)] [&::-webkit-scrollbar]:hidden"
      >
        {children}
      </div>
    </div>
  );
}
