"use client";

import { useRef } from "react";
import Link from "next/link";

type CategoryItem = { name: string; slug: string; imageUrl?: string | null };

function CategoryTile({ name, slug, imageUrl }: CategoryItem) {
  return (
    <Link
      href={`/categoria/${slug}`}
      className="group w-40 shrink-0 sm:w-52 [scroll-snap-align:start]"
    >
      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-steel-200 bg-steel-100 shadow-sm transition-all duration-200 group-hover:border-brand-300 group-hover:shadow-lg group-hover:shadow-steel-900/8">
        {imageUrl ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt={name}
              className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />
            <span className="absolute inset-x-0 bottom-0 line-clamp-2 p-3 text-sm font-semibold leading-tight text-white">
              {name}
            </span>
          </>
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-brand-600 to-brand-700 p-3">
            <span className="line-clamp-3 text-center font-display text-base font-bold leading-tight text-white">
              {name}
            </span>
          </div>
        )}
      </div>
    </Link>
  );
}

export function CategoryCarousel({ categories }: { categories: CategoryItem[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  function scroll(dir: "left" | "right") {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === "right" ? 340 : -340, behavior: "smooth" });
  }

  return (
    <div className="relative overflow-hidden">
      {/* Flecha izquierda — desktop */}
      <button
        onClick={() => scroll("left")}
        aria-label="Categorías anteriores"
        className="absolute left-0 top-1/2 z-10 hidden -translate-y-1/2 md:flex h-9 w-9 items-center justify-center rounded-full border border-steel-200 bg-white shadow-md text-steel-600 transition-colors hover:border-brand-300 hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current stroke-2" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
        </svg>
      </button>

      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto [scroll-snap-type:x_mandatory] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden px-4 md:px-12 py-2"
      >
        {categories.map((cat) => (
          <CategoryTile key={cat.slug} name={cat.name} slug={cat.slug} imageUrl={cat.imageUrl} />
        ))}
        <div className="shrink-0 w-1" aria-hidden="true" />
      </div>

      {/* Flecha derecha — desktop */}
      <button
        onClick={() => scroll("right")}
        aria-label="Más categorías"
        className="absolute right-0 top-1/2 z-10 hidden -translate-y-1/2 md:flex h-9 w-9 items-center justify-center rounded-full border border-steel-200 bg-white shadow-md text-steel-600 transition-colors hover:border-brand-300 hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current stroke-2" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
        </svg>
      </button>

      {/* Indicador de scroll en móvil */}
      <div className="mt-1 flex items-center justify-center gap-1 md:hidden" aria-hidden="true">
        <span className="text-[10px] font-medium text-steel-400">Desliza para ver más</span>
        <svg viewBox="0 0 24 24" className="h-3 w-3 fill-none stroke-steel-400 stroke-2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
        </svg>
      </div>
    </div>
  );
}
