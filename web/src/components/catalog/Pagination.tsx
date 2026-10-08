// Paginación server-rendered (sin JS): cada página es una URL real,
// indexable y compartible — como pide prompt-frontend §5 ("sin scroll
// infinito sin URL").
export function Pagination({
  currentPage,
  totalPages,
  searchParams,
}: {
  currentPage: number;
  totalPages: number;
  searchParams: Record<string, string | undefined>;
}) {
  if (totalPages <= 1) return null;

  function hrefFor(page: number): string {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(searchParams)) {
      if (value && key !== "pagina") params.set(key, value);
    }
    if (page > 1) params.set("pagina", String(page));
    const qs = params.toString();
    return `${qs ? `?${qs}` : ""}#productos`;
  }

  return (
    <nav
      aria-label="Paginación de productos"
      className="mt-8 flex items-center justify-center gap-2"
    >
      <a
        href={hrefFor(currentPage - 1)}
        aria-disabled={currentPage <= 1}
        className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
          currentPage <= 1
            ? "pointer-events-none border-steel-100 text-steel-300"
            : "border-steel-200 text-steel-700 hover:border-brand-300"
        }`}
      >
        Anterior
      </a>
      <span className="font-mono text-sm text-steel-600">
        Página {currentPage} de {totalPages}
      </span>
      <a
        href={hrefFor(currentPage + 1)}
        aria-disabled={currentPage >= totalPages}
        className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
          currentPage >= totalPages
            ? "pointer-events-none border-steel-100 text-steel-300"
            : "border-steel-200 text-steel-700 hover:border-brand-300"
        }`}
      >
        Siguiente
      </a>
    </nav>
  );
}
