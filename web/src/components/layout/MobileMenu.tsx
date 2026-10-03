"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { GenderNavItem } from "@/components/layout/CategoryNav";

export function MobileMenu({ genders }: { genders: GenderNavItem[] }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Abrir menú de categorías"
        aria-expanded={open}
        className="flex h-10 w-10 items-center justify-center rounded-lg border border-steel-200 text-steel-700 transition-colors hover:border-brand-300 hover:text-brand-700"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-2" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
        </svg>
      </button>

      {/* Backdrop */}
      <div
        aria-hidden
        onClick={() => setOpen(false)}
        className={`fixed inset-0 z-40 bg-black/40 transition-opacity duration-300 ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      {/* Drawer */}
      <div
        role="dialog"
        aria-modal
        aria-label="Menú de categorías"
        className={`fixed right-0 top-0 z-50 flex h-full w-72 flex-col bg-white shadow-2xl transition-transform duration-300 ease-in-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-steel-100 px-4 py-3">
          <span className="font-display text-xs font-semibold text-steel-500">
            Categorías
          </span>
          <button
            onClick={() => setOpen(false)}
            aria-label="Cerrar menú"
            className="flex h-8 w-8 items-center justify-center rounded-full text-steel-400 transition-colors hover:bg-steel-100 hover:text-steel-900"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-2" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-2">
          {genders.map((g) => (
            <div key={g.slug} className="border-b border-steel-50 pb-2 last:border-0">
              <Link
                href={`/categoria/${g.slug}`}
                className="flex items-center gap-2 px-4 pt-3 pb-1 text-sm font-bold text-steel-900"
              >
                {g.name}
                {g.total === 0 && (
                  <span className="rounded-full bg-steel-100 px-1.5 py-0.5 text-[9px] font-medium text-steel-400">
                    Pronto
                  </span>
                )}
              </Link>
              {g.children.map((c) => {
                const isActive = pathname === `/categoria/${c.slug}`;
                return (
                  <Link
                    key={c.slug}
                    href={`/categoria/${c.slug}`}
                    className={`flex items-center justify-between gap-3 px-6 py-2.5 text-sm transition-colors ${
                      isActive
                        ? "font-semibold text-brand-700"
                        : "text-steel-600 hover:text-steel-900"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span
                        className={`h-1.5 w-1.5 shrink-0 rounded-full ${isActive ? "bg-brand-600" : "bg-steel-200"}`}
                        aria-hidden
                      />
                      {c.name}
                    </span>
                    <span className="font-mono text-xs text-steel-400">{c.count}</span>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
      </div>
    </>
  );
}
