import Link from "next/link";

export type GenderNavItem = {
  name: string;
  slug: string;
  total: number;
  children: { name: string; slug: string; count: number }[];
};

// Barra de navegación principal por género (Hombre / Mujer / Niño) — solo
// desktop. Cada género despliega sus subcategorías al pasar el cursor (o al
// enfocar con teclado). En móvil se usa el drawer (MobileMenu).
export function CategoryNav({ genders }: { genders: GenderNavItem[] }) {
  if (genders.length === 0) return null;

  return (
    <nav
      aria-label="Categorías"
      className="hidden border-t border-steel-100 bg-white md:block"
    >
      <div className="mx-auto max-w-6xl px-4">
        <ul className="flex items-center justify-center gap-2">
          {genders.map((g) => {
            const empty = g.total === 0;
            return (
              <li key={g.slug} className="group relative">
                <Link
                  href={`/categoria/${g.slug}`}
                  className="flex items-center gap-1.5 px-4 py-3 text-sm font-semibold text-steel-700 transition-colors hover:text-brand-700"
                >
                  {g.name}
                  {empty && (
                    <span className="rounded-full bg-steel-100 px-1.5 py-0.5 text-[9px] font-medium text-steel-400">
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
                  <div className="invisible absolute left-1/2 top-full z-40 min-w-[210px] -translate-x-1/2 rounded-xl border border-steel-200 bg-white p-2 opacity-0 shadow-xl shadow-steel-900/10 transition-all duration-150 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
                    {g.children.map((c) => (
                      <Link
                        key={c.slug}
                        href={`/categoria/${c.slug}`}
                        className="flex items-center justify-between gap-4 rounded-lg px-3 py-2 text-sm font-medium text-steel-700 transition-colors hover:bg-brand-50 hover:text-brand-700"
                      >
                        <span>{c.name}</span>
                        <span className="font-mono text-xs text-steel-400">{c.count}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
