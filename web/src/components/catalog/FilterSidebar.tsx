"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { AGE_RANGES, PRICE_RANGES } from "@/lib/constants";

export type FilterCounts = {
  total: number;
  disponible: number;
  conFoto: number;
  prices: Record<string, number>;
  ages: Record<string, number>;
};

export type BrandOption = {
  name: string;
  count: number;
};

type Props = {
  counts: FilterCounts;
  brands?: BrandOption[];
};

export function FilterSidebar({ counts, brands }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isFloating, setIsFloating] = useState(false);

  // "Solo disponibles" está activo por defecto (prompt-frontend §5): hay
  // que pasar disponible=0 explícito para ver también los sin stock.
  const activeDisponible = searchParams.get("disponible") !== "0";
  const activePrecio = searchParams.get("precio") ?? "";
  const activeEdad = searchParams.get("edad") ?? "";
  const activeFoto = searchParams.get("foto") === "1";
  const activeCategoria = searchParams.get("categoria") ?? "";
  const activeMarca = searchParams.get("marca") ?? "";

  const activeCount = [
    !activeDisponible,
    !!activePrecio,
    !!activeEdad,
    activeFoto,
    !!activeCategoria,
    !!activeMarca,
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
    if (value) params.set(key, value);
    else params.delete(key);
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
      {/* Disponibilidad — "Con stock" es el default */}
      <section>
        <h3 className="mb-3 text-[11px] font-semibold text-steel-600">
          Disponibilidad
        </h3>
        <div className="space-y-2.5">
          {[
            { label: `Con stock (${counts.disponible})`, value: null },
            { label: `Ver todos (${counts.total})`, value: "0" },
          ].map(({ label, value }) => (
            <label key={label} className="flex cursor-pointer items-center gap-2.5">
              <input
                type="radio"
                name="disponible"
                checked={value === null ? activeDisponible : !activeDisponible}
                onChange={() => set("disponible", value)}
                className="h-4 w-4 accent-brand-600"
              />
              <span className="text-sm text-steel-700">{label}</span>
            </label>
          ))}
        </div>
      </section>

      {/* Edad */}
      {Object.values(counts.ages).some((c) => c > 0) && (
        <section>
          <h3 className="mb-3 text-[11px] font-semibold text-steel-600">
            Edad
          </h3>
          <div className="space-y-2.5">
            <label className="flex cursor-pointer items-center gap-2.5">
              <input
                type="radio"
                name="edad"
                checked={!activeEdad}
                onChange={() => set("edad", null)}
                className="h-4 w-4 accent-brand-600"
              />
              <span className="text-sm text-steel-700">Todas las edades</span>
            </label>
            {AGE_RANGES.map((range) => {
              const count = counts.ages[range.value] ?? 0;
              if (count === 0) return null;
              return (
                <label key={range.value} className="flex cursor-pointer items-center gap-2.5">
                  <input
                    type="radio"
                    name="edad"
                    checked={activeEdad === range.value}
                    onChange={() => set("edad", range.value)}
                    className="h-4 w-4 accent-brand-600"
                  />
                  <span className="text-sm text-steel-700">
                    {range.label}
                    <span className="ml-1 text-steel-600">({count})</span>
                  </span>
                </label>
              );
            })}
          </div>
        </section>
      )}

      {/* Marca */}
      {brands && brands.length > 0 && (
        <section>
          <h3 className="mb-3 text-[11px] font-semibold text-steel-600">
            Marca
          </h3>
          <div className="space-y-2.5">
            <label className="flex cursor-pointer items-center gap-2.5">
              <input
                type="radio"
                name="marca"
                checked={!activeMarca}
                onChange={() => set("marca", null)}
                className="h-4 w-4 accent-brand-600"
              />
              <span className="text-sm text-steel-700">Todas las marcas</span>
            </label>
            <div className={brands.length > 8 ? "max-h-56 space-y-2.5 overflow-y-auto pr-1" : "space-y-2.5"}>
              {brands.map((b) => (
                <label key={b.name} className="flex cursor-pointer items-center gap-2.5">
                  <input
                    type="radio"
                    name="marca"
                    checked={activeMarca === b.name}
                    onChange={() => set("marca", b.name)}
                    className="h-4 w-4 accent-brand-600"
                  />
                  <span className="text-sm text-steel-700">
                    {b.name}
                    <span className="ml-1 text-steel-600">({b.count})</span>
                  </span>
                </label>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Precio */}
      <section>
        <h3 className="mb-3 text-[11px] font-semibold text-steel-600">
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
                  <span className="ml-1 text-steel-600">({count})</span>
                </span>
              </label>
            );
          })}
        </div>
      </section>

      {/* Con foto */}
      {counts.conFoto > 0 && counts.conFoto < counts.total && (
        <section>
          <h3 className="mb-3 text-[11px] font-semibold text-steel-600">
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
              <span className="ml-1 text-steel-600">({counts.conFoto})</span>
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
          <div className="absolute bottom-0 left-0 right-0 flex max-h-[82vh] flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl">
            {/* Handle + header */}
            <div className="sticky top-0 z-10 shrink-0 rounded-t-2xl bg-white">
              <div className="mx-auto mt-3 h-1 w-10 rounded-full bg-steel-200" />
              <div className="flex items-center justify-between border-b border-steel-100 px-5 py-4">
                <p className="font-semibold text-steel-900">
                  Filtros
                  {activeCount > 0 && (
                    <span className="ml-2 text-sm font-normal text-steel-600">
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
            {/* Contenido scrollable — min-h-0 es necesario para que el
               overflow-y-auto funcione dentro de un flex column */}
            <div className="min-h-0 flex-1 overflow-y-auto p-5 pb-8">
              {filters}
            </div>
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden w-56 shrink-0 md:block">
        <div className="sticky top-24 rounded-xl border border-steel-200 bg-white p-5 shadow-sm">
          <p className="mb-5 text-[11px] font-semibold text-steel-600">
            Filtrar
          </p>
          {filters}
        </div>
      </aside>
    </>
  );
}
