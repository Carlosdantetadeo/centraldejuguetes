"use client";

import Link from "next/link";
import { useRef, useState, useEffect, useCallback } from "react";

export type GenderCard = {
  name: string;
  slug: string;
  total: number;
  imageUrl?: string | null;
};

const CATEGORY_EMOJI: Record<string, string> = {
  animales: "🦁", animal: "🦁",
  bebes: "🍼", bebe: "🍼",
  munecas: "🪆", muneca: "🪆",
  autos: "🚗", auto: "🚗", vehiculos: "🚗", carritos: "🚗",
  electronicos: "🤖", electronico: "🤖", robots: "🤖",
  peluches: "🧸", peluche: "🧸",
  juegos: "🎲", juego: "🎲",
  educativos: "🧩", educativo: "🧩",
  deportes: "⚽", deporte: "⚽",
  agua: "💦", playa: "🏖️",
};

function getCategoryEmoji(slug: string): string {
  return CATEGORY_EMOJI[slug.toLowerCase()] ?? "🎁";
}

const CARD_COLORS = [
  "#fff7ed",
  "#fdf2f8",
  "#eff6ff",
  "#faf5ff",
  "#f0fdf4",
  "#fffbeb",
  "#ecfdf5",
];

const SCROLL_BY = 320;

export function GenderBand({ genders }: { genders: GenderCard[] }) {
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

  const scroll = (dir: "left" | "right") => {
    scrollRef.current?.scrollBy({
      left: dir === "right" ? SCROLL_BY : -SCROLL_BY,
      behavior: "smooth",
    });
  };

  if (genders.length === 0) return null;

  return (
    <section className="overflow-x-hidden border-b border-steel-100 bg-white py-5">
      <div className="mx-auto max-w-6xl px-4">
        <div className="relative w-full">
          {/* Fade + flecha izquierda */}
          {canLeft && (
            <>
              <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-14 bg-gradient-to-r from-white to-transparent" />
              <button
                onClick={() => scroll("left")}
                aria-label="Categorías anteriores"
                className="absolute left-1 top-1/2 z-20 -translate-y-1/2 rounded-full bg-white p-2 shadow-lg shadow-steel-900/10 ring-1 ring-steel-100 transition hover:bg-steel-50 active:scale-95"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-steel-600 stroke-[2.5]" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                </svg>
              </button>
            </>
          )}

          {/* Fade + flecha derecha */}
          {canRight && (
            <>
              <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-14 bg-gradient-to-l from-white to-transparent" />
              <button
                onClick={() => scroll("right")}
                aria-label="Más categorías"
                className="absolute right-1 top-1/2 z-20 -translate-y-1/2 rounded-full bg-white p-2 shadow-lg shadow-steel-900/10 ring-1 ring-steel-100 transition hover:bg-steel-50 active:scale-95"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-steel-600 stroke-[2.5]" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </button>
            </>
          )}

          {/* Carrusel */}
          <div
            ref={scrollRef}
            className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:gap-4"
          >
            {genders.map((g, idx) => (
              <Link
                key={g.slug}
                href={`/categoria/${g.slug}`}
                className="group relative flex h-40 w-36 shrink-0 snap-start flex-col overflow-hidden rounded-2xl border border-steel-200 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-lg sm:h-52 sm:w-44"
              >
                {g.imageUrl ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={g.imageUrl}
                      alt={g.name}
                      className="absolute inset-0 h-full w-full object-cover transition duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 p-2.5 sm:p-3">
                      <p className="font-display text-xs font-bold leading-tight text-white drop-shadow sm:text-sm">
                        {g.name}
                      </p>
                      <p className="mt-0.5 text-[10px] font-medium text-white/70">
                        {g.total > 0 ? `${g.total} productos` : "Próximamente"}
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div
                      className="flex flex-1 items-center justify-center"
                      style={{ backgroundColor: CARD_COLORS[idx % CARD_COLORS.length] }}
                    >
                      <span className="select-none text-5xl transition-transform duration-300 group-hover:scale-110 sm:text-6xl">
                        {getCategoryEmoji(g.slug)}
                      </span>
                    </div>
                    <div className="shrink-0 bg-white px-2.5 py-2 sm:px-3 sm:py-2.5">
                      <p className="font-display text-xs font-bold leading-tight text-steel-900 sm:text-sm">
                        {g.name}
                      </p>
                      <p className="mt-0.5 text-[10px] font-medium text-steel-600">
                        {g.total > 0 ? `${g.total} productos` : "Próximamente"}
                      </p>
                    </div>
                  </>
                )}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
