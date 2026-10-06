import Link from "next/link";
import { getSiteSettings } from "@/lib/settings";

function SocialIcon({ icon }: { icon: string }) {
  const common = "h-5 w-5 fill-current";
  if (icon === "facebook")
    return (
      <svg viewBox="0 0 24 24" className={common} aria-hidden>
        <path d="M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.77-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.44 2.89h-2.34v6.99A10 10 0 0 0 22 12z" />
      </svg>
    );
  if (icon === "instagram")
    return (
      <svg viewBox="0 0 24 24" className={common} aria-hidden>
        <path d="M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41a3.7 3.7 0 0 1-1.38-.9 3.7 3.7 0 0 1-.9-1.38c-.16-.42-.36-1.06-.41-2.23C2.17 15.58 2.16 15.2 2.16 12s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41C8.42 2.17 8.8 2.16 12 2.16zm0 3.68a6.16 6.16 0 1 0 0 12.32 6.16 6.16 0 0 0 0-12.32zm0 10.16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.4-10.4a1.44 1.44 0 1 1-2.88 0 1.44 1.44 0 0 1 2.88 0z" />
      </svg>
    );
  return (
    <svg viewBox="0 0 24 24" className={common} aria-hidden>
      <path d="M16.6 5.82a4.28 4.28 0 0 1-1-2.82h-3.1v12.4a2.6 2.6 0 1 1-2.6-2.6c.27 0 .53.04.78.12v-3.2a5.8 5.8 0 0 0-.78-.05 5.8 5.8 0 1 0 5.8 5.8V9.01a7.35 7.35 0 0 0 4.3 1.38V7.28a4.28 4.28 0 0 1-3.4-1.46z" />
    </svg>
  );
}

export async function Footer() {
  const settings = await getSiteSettings();
  const whatsappNumber = settings.whatsappNumber;
  const waLink = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
    "Hola, quiero información sobre sus productos.",
  )}`;
  const mapsUrl = settings.address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(settings.address)}`
    : null;
  // Se muestran los 3 íconos siempre — los que todavía no tienen link
  // propio quedan sin href (no son un enlace roto, son "próximamente").
  const socials = [
    { name: "Facebook", href: settings.socialFacebook, icon: "facebook" },
    { name: "Instagram", href: settings.socialInstagram, icon: "instagram" },
    { name: "TikTok", href: settings.socialTiktok, icon: "tiktok" },
  ];

  return (
    <footer className="mt-auto border-t border-steel-800 bg-steel-900 text-steel-100">
      {/* Únete a nuestra comunidad */}
      <div className="border-b border-steel-800 bg-gradient-to-r from-steel-900 via-steel-800 to-steel-900">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-5 px-4 py-9 text-center sm:flex-row sm:justify-between sm:text-left">
          <div className="flex items-center gap-4">
            <span className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-600/20 text-brand-400 sm:flex">
              <svg viewBox="0 0 24 24" className="h-6 w-6 fill-none stroke-current stroke-2" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm-3.75 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0ZM21 12c0 4.556-4.03 8.25-9 8.25a9.76 9.76 0 0 1-4-.84L3 21l1.5-4.5A8.86 8.86 0 0 1 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
              </svg>
            </span>
            <div>
              <p className="font-display text-xl font-bold text-white sm:text-2xl">
                Pedidos y cotizaciones
              </p>
              <p className="mt-1.5 text-sm text-steel-300">
                Para consultas, novedades y precios mayoristas, escribinos directo.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            {whatsappNumber && (
              <a
                href={waLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-whatsapp px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-whatsapp-dark"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden>
                  <path d="M17.47 14.38c-.29-.15-1.71-.84-1.97-.94-.26-.1-.46-.15-.65.15-.19.29-.75.94-.92 1.13-.17.19-.34.22-.63.07-.29-.15-1.22-.45-2.33-1.43-.86-.77-1.44-1.72-1.61-2.01-.17-.29-.02-.45.13-.59.13-.13.29-.34.44-.51.15-.17.19-.29.29-.48.1-.19.05-.36-.02-.51-.07-.15-.65-1.57-.89-2.15-.24-.57-.48-.49-.65-.5-.17-.01-.36-.01-.55-.01-.19 0-.51.07-.77.36-.26.29-1.01.99-1.01 2.41 0 1.42 1.03 2.79 1.18 2.98.15.19 2.03 3.1 4.92 4.35.69.3 1.22.47 1.64.6.69.22 1.31.19 1.81.12.55-.08 1.71-.7 1.95-1.37.24-.67.24-1.25.17-1.37-.07-.12-.26-.19-.55-.34zM12.04 2.5A9.5 9.5 0 0 0 2.55 12c0 1.67.44 3.31 1.27 4.75L2.5 21.5l4.87-1.28A9.46 9.46 0 0 0 12.04 21.5 9.5 9.5 0 0 0 21.5 12 9.5 9.5 0 0 0 12.04 2.5z" />
                </svg>
                WhatsApp
              </a>
            )}
            {socials.map((s) =>
              s.href ? (
                <a
                  key={s.name}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl border border-steel-700 bg-steel-800 px-4 py-2.5 text-sm font-semibold text-steel-100 transition-all hover:border-brand-500 hover:bg-brand-600 hover:text-white"
                >
                  <SocialIcon icon={s.icon} />
                  {s.name}
                </a>
              ) : (
                <span
                  key={s.name}
                  title={`${s.name} — próximamente`}
                  aria-disabled="true"
                  className="inline-flex cursor-not-allowed items-center gap-2 rounded-xl border border-steel-800 bg-steel-800/40 px-4 py-2.5 text-sm font-semibold text-steel-500"
                >
                  <SocialIcon icon={s.icon} />
                  {s.name}
                </span>
              ),
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 md:grid-cols-3">
        {/* Marca + tagline + confianza */}
        <div>
          <p className="text-lg font-semibold text-white">{settings.siteName}</p>
          {(settings.footerTagline || settings.siteDescription) && (
            <p className="mt-2 text-sm leading-6 text-steel-300">
              {settings.footerTagline || settings.siteDescription}
            </p>
          )}
          <ul className="mt-4 space-y-2 text-xs text-steel-400">
            {["Atención personalizada por WhatsApp", "Precios mayoristas y al detalle", "Catálogo actualizado permanentemente"].map((item) => (
              <li key={item} className="flex items-center gap-2">
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0 fill-none stroke-brand-500 stroke-2" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Contacto */}
        <div>
          <p className="font-medium text-white">Contacto</p>
          <ul className="mt-3 space-y-3 text-sm text-steel-300">
            {settings.address && (
              <li className="flex items-start gap-2">
                <svg viewBox="0 0 24 24" className="mt-0.5 h-4 w-4 shrink-0 fill-current text-brand-500" aria-hidden>
                  <path d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z" />
                </svg>
                <a href={mapsUrl!} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                  {settings.address}
                </a>
              </li>
            )}
            {settings.phone && (
              <li className="flex items-center gap-2">
                <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 fill-current text-brand-500" aria-hidden>
                  <path d="M6.6 10.8a15.5 15.5 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25 11.4 11.4 0 0 0 3.6.57 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1 11.4 11.4 0 0 0 .57 3.6 1 1 0 0 1-.25 1l-2.22 2.2z" />
                </svg>
                <a href={`tel:${settings.phone}`} className="hover:text-white transition-colors">
                  {settings.phone}
                </a>
              </li>
            )}
          </ul>
          {whatsappNumber && (
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-whatsapp px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-whatsapp-dark hover:shadow-md"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden>
              <path d="M17.47 14.38c-.29-.15-1.71-.84-1.97-.94-.26-.1-.46-.15-.65.15-.19.29-.75.94-.92 1.13-.17.19-.34.22-.63.07-.29-.15-1.22-.45-2.33-1.43-.86-.77-1.44-1.72-1.61-2.01-.17-.29-.02-.45.13-.59.13-.13.29-.34.44-.51.15-.17.19-.29.29-.48.1-.19.05-.36-.02-.51-.07-.15-.65-1.57-.89-2.15-.24-.57-.48-.49-.65-.5-.17-.01-.36-.01-.55-.01-.19 0-.51.07-.77.36-.26.29-1.01.99-1.01 2.41 0 1.42 1.03 2.79 1.18 2.98.15.19 2.03 3.1 4.92 4.35.69.3 1.22.47 1.64.6.69.22 1.31.19 1.81.12.55-.08 1.71-.7 1.95-1.37.24-.67.24-1.25.17-1.37-.07-.12-.26-.19-.55-.34zM12.04 2.5A9.5 9.5 0 0 0 2.55 12c0 1.67.44 3.31 1.27 4.75L2.5 21.5l4.87-1.28A9.46 9.46 0 0 0 12.04 21.5 9.5 9.5 0 0 0 21.5 12 9.5 9.5 0 0 0 12.04 2.5z" />
            </svg>
            Cotiza por WhatsApp
          </a>
          )}
        </div>

        {/* Enlaces */}
        <div>
          <p className="font-medium text-white">Enlaces</p>
          <ul className="mt-3 space-y-2.5 text-sm text-steel-300">
            <li>
              <Link href="/" className="hover:text-white transition-colors">Inicio</Link>
            </li>
            <li>
              <Link href="/buscar" className="hover:text-white transition-colors">Buscar productos</Link>
            </li>
            <li>
              <Link href="/preguntas-frecuentes" className="hover:text-white transition-colors">Preguntas frecuentes</Link>
            </li>
            <li>
              <Link href="/privacidad" className="hover:text-white transition-colors">Política de privacidad</Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-steel-800 px-4 py-4 text-center text-xs text-steel-400">
        © {new Date().getFullYear()} {settings.siteName}. Todos los derechos reservados.
      </div>
    </footer>
  );
}
