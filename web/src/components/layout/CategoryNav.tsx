"use client";

import Link from "next/link";
import { useRef, useState, type FocusEvent, type KeyboardEvent } from "react";

export type GenderNavItem = {
  name: string;
  slug: string;
  total: number;
  imageUrl?: string | null;
  children: { name: string; slug: string; count: number; imageUrl?: string | null }[];
};

// Barra de navegación principal por género (Hombre / Mujer / Niño) — solo
// desktop. Cada género despliega un mega-menú con imagen por subcategoría
// al pasar el cursor (o al enfocar con teclado), al estilo Pop Mart/LEGO.
// En móvil se usa el drawer (MobileMenu).
export function CategoryNav({ genders }: { genders: GenderNavItem[] }) {
  if (genders.length === 0) return null;

  return (
    <nav
      aria-label="Categorías"
      className="hidden border-t border-steel-100 bg-white md:block"
    >
      <div className="mx-auto max-w-6xl px-4">
        <ul className="flex flex-wrap items-center justify-center gap-x-1 gap-y-0.5">
          {genders.map((g) => (
            <GenderMenuItem key={g.slug} gender={g} />
          ))}
        </ul>
      </div>
    </nav>
  );
}

function GenderMenuItem({ gender: g }: { gender: GenderNavItem }) {
  const empty = g.total === 0;
  const [open, setOpen] = useState(false);
  const liRef = useRef<HTMLLIElement>(null);
  const triggerRef = useRef<HTMLAnchorElement>(null);

  // El menú se abre/cierra con estado explícito (no solo CSS :hover /
  // :focus-within) para que Esc pueda cerrarlo incluso cuando el foco
  // sigue sobre el propio trigger — si no, :focus-within lo reabriría de
  // inmediato (H-03). El foco nunca queda atrapado: Esc lo devuelve al
  // link de nivel superior.
  function handleKeyDown(e: KeyboardEvent<HTMLLIElement>) {
    if (e.key !== "Escape") return;
    setOpen(false);
    triggerRef.current?.focus();
  }

  function handleBlur(e: FocusEvent<HTMLLIElement>) {
    if (!liRef.current?.contains(e.relatedTarget as Node | null)) {
      setOpen(false);
    }
  }

  return (
    <li
      ref={liRef}
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
    >
      <Link
        ref={triggerRef}
        href={`/categoria/${g.slug}`}
        className="flex items-center gap-1 whitespace-nowrap px-2.5 py-2.5 text-[13px] font-semibold text-steel-700 transition-colors hover:text-brand-700"
      >
        {g.name}
        {empty && (
          <span className="rounded-full bg-steel-100 px-1.5 py-0.5 text-[9px] font-medium text-steel-600">
            Pronto
          </span>
        )}
        {g.children.length > 0 && (
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-none stroke-current stroke-2 opacity-60" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="m6 9 6 6 6-6" />
          </svg>
        )}
      </Link>

      {g.children.length > 0 && (
        <div
          className={`absolute left-1/2 top-full z-40 -translate-x-1/2 rounded-2xl border border-steel-200 bg-white p-4 shadow-xl shadow-steel-900/10 transition-all duration-150 ${
            open ? "visible opacity-100" : "invisible opacity-0"
          } ${g.children.length > 6 ? "w-[min(90vw,640px)]" : "w-[min(90vw,480px)]"}`}
        >
          <div className={`grid gap-3 ${g.children.length > 6 ? "grid-cols-4" : "grid-cols-3"}`}>
            {g.children.map((c) => (
              <Link
                key={c.slug}
                href={`/categoria/${c.slug}`}
                className="group/tile relative flex aspect-square flex-col overflow-hidden rounded-xl border border-steel-100 transition-all hover:border-brand-300 hover:shadow-md"
              >
                {c.imageUrl ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={c.imageUrl}
                      alt={c.name}
                      className="absolute inset-0 h-full w-full object-cover transition duration-300 group-hover/tile:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                  </>
                ) : (
                  <div className="absolute inset-0 bg-steel-50" />
                )}
                <div className="relative mt-auto p-2">
                  <p className={`line-clamp-2 text-xs font-bold leading-tight ${c.imageUrl ? "text-white drop-shadow" : "text-steel-900"}`}>
                    {c.name}
                  </p>
                  <p className={`mt-0.5 text-[10px] font-medium ${c.imageUrl ? "text-white/70" : "text-steel-600"}`}>
                    {c.count} {c.count === 1 ? "producto" : "productos"}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </li>
  );
}
