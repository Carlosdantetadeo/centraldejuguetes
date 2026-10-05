import Link from "next/link";
import { SearchBar } from "@/components/catalog/SearchBar";
import { MobileMenu } from "@/components/layout/MobileMenu";
import { CategoryNav, type GenderNavItem } from "@/components/layout/CategoryNav";
import { getGenderNav } from "@/lib/catalog";
import { getSiteSettings } from "@/lib/settings";

export async function Header() {
  const [settings, genderRaw] = await Promise.all([
    getSiteSettings(),
    getGenderNav(),
  ]);
  const genders: GenderNavItem[] = genderRaw.map((g) => {
    const children = g.children.map((c) => ({
      name: c.name,
      slug: c.slug,
      count: c._count.products,
    }));
    return {
      name: g.name,
      slug: g.slug,
      total: g._count.products + children.reduce((sum, c) => sum + c.count, 0),
      children,
    };
  });

  const waHref = settings.whatsappNumber
    ? `https://wa.me/${settings.whatsappNumber}?text=${encodeURIComponent(
        "Hola, quiero información sobre sus productos.",
      )}`
    : null;

  return (
    <header className="border-b border-steel-200 bg-white/95 backdrop-blur-md shadow-sm">
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex items-center gap-4 py-3">
          {/* Logo */}
          <Link
            href="/"
            className="shrink-0 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
          >
            {settings.logoUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={settings.logoUrl}
                alt={settings.siteName}
                className="h-10 w-auto sm:h-11"
              />
            ) : (
              <span className="font-display text-lg font-bold tracking-tight text-steel-900 sm:text-xl">
                {settings.siteName}
              </span>
            )}
          </Link>

          {/* Search — desktop */}
          <div className="ml-auto hidden flex-1 sm:flex">
            <SearchBar id="search-desktop" />
          </div>

          {/* WhatsApp — desktop */}
          {waHref && (
            <a
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-2 hidden shrink-0 items-center gap-2 rounded-xl bg-whatsapp px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-whatsapp-dark sm:flex"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden>
                <path d="M17.47 14.38c-.29-.15-1.71-.84-1.97-.94-.26-.1-.46-.15-.65.15-.19.29-.75.94-.92 1.13-.17.19-.34.22-.63.07-.29-.15-1.22-.45-2.33-1.43-.86-.77-1.44-1.72-1.61-2.01-.17-.29-.02-.45.13-.59.13-.13.29-.34.44-.51.15-.17.19-.29.29-.48.1-.19.05-.36-.02-.51-.07-.15-.65-1.57-.89-2.15-.24-.57-.48-.49-.65-.5-.17-.01-.36-.01-.55-.01-.19 0-.51.07-.77.36-.26.29-1.01.99-1.01 2.41 0 1.42 1.03 2.79 1.18 2.98.15.19 2.03 3.1 4.92 4.35.69.3 1.22.47 1.64.6.69.22 1.31.19 1.81.12.55-.08 1.71-.7 1.95-1.37.24-.67.24-1.25.17-1.37-.07-.12-.26-.19-.55-.34zM12.04 2.5A9.5 9.5 0 0 0 2.55 12c0 1.67.44 3.31 1.27 4.75L2.5 21.5l4.87-1.28A9.46 9.46 0 0 0 12.04 21.5 9.5 9.5 0 0 0 21.5 12 9.5 9.5 0 0 0 12.04 2.5z" />
              </svg>
              WhatsApp
            </a>
          )}

          {/* Hamburger — solo móvil */}
          <div className="ml-auto md:hidden">
            <MobileMenu genders={genders} />
          </div>
        </div>

        {/* Search — mobile */}
        <div className="pb-3 sm:hidden">
          <SearchBar id="search-mobile" />
        </div>
      </div>

      {/* Navegación principal por género — desktop */}
      <CategoryNav genders={genders} />
    </header>
  );
}
