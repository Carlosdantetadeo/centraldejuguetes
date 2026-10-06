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
    scrollRef.current?.scrollBy({ left: dir === "right" ? 600 : -600, behavior: "smooth" });
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="font-display text-lg font-extrabold uppercase tracking-wide text-steel-900 sm:text-xl">
          {title}
        </h2>
        <div className="flex items-center gap-3">
          {viewAllHref && (
            <Link
              href={viewAllHref}
              className="text-sm font-semibold text-brand-600 hover:text-brand-700 hover:underline"
            >
              Ver todo →
            </Link>
          )}
          <div className="hidden items-center gap-1.5 sm:flex">
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

      <div className="relative">
        {/* Sombra izquierda: sugiere que hay más contenido hacia atrás */}
        {canLeft && (
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-gradient-to-r from-white to-transparent" />
        )}

        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto pb-1 [scroll-snap-type:x_mandatory] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {children}
        </div>

        {/* Sombra derecha: sugiere "seguí la flecha", no corte abrupto */}
        {canRight && (
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-14 bg-gradient-to-l from-white to-transparent" />
        )}
      </div>
    </div>
  );
}
