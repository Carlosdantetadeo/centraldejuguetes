"use client";

import { useRef } from "react";
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

  function scroll(dir: "left" | "right") {
    scrollRef.current?.scrollBy({ left: dir === "right" ? 600 : -600, behavior: "smooth" });
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="font-display text-lg font-bold tracking-tight text-steel-900 sm:text-xl">
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
              aria-label="Anterior"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-steel-200 bg-white text-steel-600 transition-colors hover:border-brand-300 hover:text-brand-700"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current stroke-2" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
              </svg>
            </button>
            <button
              onClick={() => scroll("right")}
              aria-label="Siguiente"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-steel-200 bg-white text-steel-600 transition-colors hover:border-brand-300 hover:text-brand-700"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current stroke-2" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          </div>
        </div>
      </div>
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto pb-1 [scroll-snap-type:x_mandatory] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {children}
      </div>
    </div>
  );
}
