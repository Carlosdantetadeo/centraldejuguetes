"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

const PRICE_RANGES = [
  { label: "Hasta S/ 50", value: "0-50" },
  { label: "S/ 50 – S/ 200", value: "50-200" },
  { label: "S/ 200 – S/ 500", value: "200-500" },
  { label: "Más de S/ 500", value: "500-99999" },
] as const;

export type FilterCounts = {
  total: number;
  disponible: number;
  conFoto: number;
  prices: Record<string, number>;
};

export type CategoryOption = {
  name: string;
  slug: string;
  count: number;
  imageUrl?: string | null;
};

type Props = {
  counts: FilterCounts;
  categories?: CategoryOption[];
};

export function FilterSidebar({ counts, categories }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isFloating, setIsFloating] = useState(false);

  const activeDisponible = searchParams.get("disponible") === "1";
  const activePrecio = searchParams.get("precio") ?? "";
  const activeFoto = searchParams.get("foto") === "1";
  const activeCategoria = searchParams.get("categoria") ?? "";

  const activeCount = [
    activeDisponible,
    !!activePrecio,
    activeFoto,
    !!activeCategoria,
  ].filter(Boolean).length;

  useEffect(() => {
    const onScroll = () => setIsFloating(window.scrollY > 220);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Bloquea el scroll del body cuando el drawer está abierto
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  function set(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    value ? params.set(key, value) : params.delete(key);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }

  function clearAll() {
    router.push(pathname, { scroll: false });
  }

  const filterIcon = (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current stroke-2" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75" />
    </svg>
  );

  const activeBadge = activeCount > 0 && (
    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-600 text-[10px] font-bold text-white">
      {activeCount}
    </span>
  );

  const filters = (
    <div className="space-y-6">
      {/* Categoría — solo en home page */}
      {categories && categories.length > 0 && (
        <section>
          <h3 className="mb-3 text-[11px] font-semibold text-steel-500">
            Categoría
          </h3>
          <div className="space-y-2">
            <label className="flex cursor-pointer items-center gap-2.5">
              <input
                type="radio"
                name="categoria"
                checked={!activeCategoria}
                onChange={() => set("categoria", null)}
                className="h-4 w-4 accent-brand-600"
              />
              <span className="text-sm text-steel-700">
                Todas
                <span className="ml-1 text-steel-400">({counts.total})</span>
              </span>
            </label>
            {categories.map((cat) => (
              <label key={cat.slug} className="flex cursor-pointer items-center gap-2.5">
                <input
                  type="radio"
                  name="categoria"
                  checked={activeCategoria === cat.slug}
                  onChange={() => set("categoria", cat.slug)}
                  className="h-4 w-4 accent-brand-600"
                />
                <span className="text-sm text-steel-700">
                  {cat.name}
                  <span className="ml-1 text-steel-400">({cat.count})</span>
                </span>
              </label>
            ))}
          </div>
        </section>
      )}

      {/* Disponibilidad */}
      <section>
        <h3 className="mb-3 text-[11px] font-semibold text-steel-500">
          Disponibilidad
        </h3>
        <div className="space-y-2.5">
          {[
            { label: `Todos (${counts.total})`, value: null },
            { label: `Con stock (${counts.disponible})`, value: "1" },
          ].map(({ label, value }) => (
            <label key={label} className="flex cursor-pointer items-center gap-2.5">
              <input
                type="radio"
                name="disponible"
                checked={value === null ? !activeDisponible : activeDisponible}
                onChange={() => set("disponible", value)}
                className="h-4 w-4 accent-brand-600"
              />
              <span className="text-sm text-steel-700">{label}</span>
            </label>
          ))}
        </div>
      </section>

      {/* Precio */}
      <section>
        <h3 className="mb-3 text-[11px] font-semibold text-steel-500">
          Precio
        </h3>
        <div className="space-y-2.5">
          <label className="flex cursor-pointer items-center gap-2.5">
            <input
              type="radio"
              name="precio"
              checked={!activePrecio}
              onChange={() => set("precio", null)}
              className="h-4 w-4 accent-brand-600"
            />
            <span className="text-sm text-steel-700">Todos los precios</span>
          </label>
          {PRICE_RANGES.map((range) => {
            const count = counts.prices[range.value] ?? 0;
            if (count === 0) return null;
            return (
              <label key={range.value} className="flex cursor-pointer items-center gap-2.5">
                <input
                  type="radio"
                  name="precio"
                  checked={activePrecio === range.value}
                  onChange={() => set("precio", range.value)}
                  className="h-4 w-4 accent-brand-600"
                />
                <span className="text-sm text-steel-700">
                  {range.label}
                  <span className="ml-1 text-steel-400">({count})</span>
                </span>
              </label>
            );
          })}
        </div>
      </section>

      {/* Con foto */}
      {counts.conFoto > 0 && counts.conFoto < counts.total && (
        <section>
          <h3 className="mb-3 text-[11px] font-semibold text-steel-500">
            Imágenes
          </h3>
          <label className="flex cursor-pointer items-center gap-2.5">
            <input
              type="checkbox"
              checked={activeFoto}
              onChange={() => set("foto", activeFoto ? null : "1")}
              className="h-4 w-4 accent-brand-600"
            />
            <span className="text-sm text-steel-700">
              Solo con foto
              <span className="ml-1 text-steel-400">({counts.conFoto})</span>
            </span>
          </label>
        </section>
      )}

      {/* Limpiar */}
      {activeCount > 0 && (
        <button
          onClick={clearAll}
          className="text-sm font-semibold text-brand-600 transition-colors hover:text-brand-700 hover:underline"
        >
          Limpiar filtros
        </button>
      )}
    </div>
  );

  return (
    <>
      {/* Mobile toggle inline — visible al inicio de la sección */}
      <div className="mb-4 md:hidden">
        <button
          onClick={() => setMobileOpen(true)}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-steel-200 bg-white px-4 py-2.5 text-sm font-semibold text-steel-700 shadow-sm transition hover:border-brand-300"
        >
          {filterIcon}
          Filtros
          {activeBadge}
        </button>
      </div>

      {/* FAB flotante en móvil — aparece al hacer scroll */}
      {isFloating && (
        <button
          onClick={() => setMobileOpen(true)}
          aria-label="Abrir filtros"
          className="fixed bottom-5 left-5 z-40 flex items-center gap-2 rounded-full border border-steel-200 bg-white px-4 py-3 text-sm font-semibold text-steel-700 shadow-lg shadow-steel-900/10 transition hover:border-brand-300 md:hidden"
        >
          {filterIcon}
          Filtros
          {activeBadge}
        </button>
      )}

      {/* Drawer inferior móvil */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          {/* Panel */}
          <div className="absolute bottom-0 left-0 right-0 max-h-[82vh] flex flex-col rounded-t-2xl bg-white shadow-2xl">
            {/* Handle + header */}
            <div className="sticky top-0 z-10 rounded-t-2xl bg-white">
              <div className="mx-auto mt-3 h-1 w-10 rounded-full bg-steel-200" />
              <div className="flex items-center justify-between border-b border-steel-100 px-5 py-4">
                <p className="font-semibold text-steel-900">
                  Filtros
                  {activeCount > 0 && (
                    <span className="ml-2 text-sm font-normal text-steel-400">
                      {activeCount} activo{activeCount !== 1 ? "s" : ""}
                    </span>
                  )}
                </p>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-steel-500 transition hover:bg-steel-100"
                  aria-label="Cerrar filtros"
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current stroke-2" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            {/* Contenido scrollable */}
            <div className="overflow-y-auto p-5 pb-8">
              {filters}
            </div>
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden w-56 shrink-0 md:block">
        <div className="sticky top-24 rounded-xl border border-steel-200 bg-white p-5 shadow-sm">
          <p className="mb-5 text-[11px] font-semibold text-steel-500">
            Filtrar
          </p>
          {filters}
        </div>
      </aside>
    </>
  );
}
