import Link from "next/link";

type CategoryCardProps = {
  name: string;
  slug: string;
  description?: string | null;
  productCount?: number;
};

export function CategoryCard({
  name,
  slug,
  description,
  productCount,
}: CategoryCardProps) {
  return (
    <Link
      href={`/categoria/${slug}`}
      className="group relative overflow-hidden rounded-2xl border border-steel-200 bg-white p-6 transition-all duration-300 hover:border-brand-300 hover:shadow-xl hover:shadow-steel-900/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
    >
      {/* Keyline roja de marca que aparece al pasar el cursor. */}
      <span
        className="absolute inset-y-0 left-0 w-1 bg-brand-500 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        aria-hidden="true"
      />
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-xl font-bold tracking-tight text-steel-900 transition-colors group-hover:text-brand-700">
            {name}
          </h2>
          {description ? (
            <p className="mt-2 text-sm leading-6 text-steel-600">{description}</p>
          ) : null}
        </div>
        {typeof productCount === "number" ? (
          <span className="shrink-0 rounded-lg bg-steel-100 px-2.5 py-1 font-mono text-xs font-medium text-steel-600 transition-colors group-hover:bg-brand-50 group-hover:text-brand-700">
            {productCount} prod.
          </span>
        ) : null}
      </div>
      <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand-600">
        Ver productos
        <svg
          viewBox="0 0 24 24"
          className="h-3.5 w-3.5 fill-none stroke-current stroke-2 transition-transform duration-200 group-hover:translate-x-1"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
        </svg>
      </span>
    </Link>
  );
}
