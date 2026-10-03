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
