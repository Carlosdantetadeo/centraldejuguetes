import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Archivo, DM_Sans, JetBrains_Mono } from "next/font/google";
import { getSiteSettings } from "@/lib/settings";
import { brandThemeCss } from "@/lib/theme";
import { getSiteUrl } from "@/lib/utils";
import { JsonLd } from "@/components/JsonLd";
import { buildOrganizationJsonLd, buildWebSiteJsonLd } from "@/lib/jsonld";
import "./globals.css";

const GA4_ID = process.env.NEXT_PUBLIC_GA4_ID;
const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
});

// Display con carácter industrial para titulares.
const archivo = Archivo({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-archivo",
});

// Monoespaciada para datos técnicos: medidas, calibres, precios.
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-jetbrains-mono",
});

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
    alternates: { canonical: getSiteUrl() },
    title: {
      default: settings.siteName,
      template: `%s | ${settings.siteName}`,
    },
    description: settings.siteDescription,
    icons: settings.faviconUrl ? { icon: settings.faviconUrl } : undefined,
    manifest: "/manifest.webmanifest",
    appleWebApp: {
      capable: true,
      statusBarStyle: "default",
      title: settings.siteName,
    },
    openGraph: {
      type: "website",
      locale: settings.locale.replace("-", "_"),
      siteName: settings.siteName,
      description: settings.siteDescription,
      images: settings.ogImageUrl ? [{ url: settings.ogImageUrl }] : undefined,
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const settings = await getSiteSettings();
  return (
    <html
      lang={settings.locale}
      className={`${dmSans.variable} ${archivo.variable} ${jetbrainsMono.variable} h-full`}
    >
      <head>
        {/* Tema por instancia: rampa de marca en el head → sin flash de color */}
        <style dangerouslySetInnerHTML={{ __html: brandThemeCss(settings) }} />
        <JsonLd data={buildOrganizationJsonLd(settings)} />
        <JsonLd data={buildWebSiteJsonLd(settings)} />

        {/* GA4 — solo si está configurado (prompt-frontend §8) */}
        {GA4_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA4_ID}`}
              strategy="afterInteractive"
            />
            <Script id="ga4-init" strategy="afterInteractive">
              {`window.dataLayer = window.dataLayer || [];
                function gtag(){window.dataLayer.push(arguments);}
                window.gtag = gtag;
                gtag('js', new Date());
                gtag('config', '${GA4_ID}');`}
            </Script>
          </>
        )}

        {/* Meta Pixel — solo si está configurado */}
        {META_PIXEL_ID && (
          <Script id="meta-pixel-init" strategy="afterInteractive">
            {`!function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window,document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '${META_PIXEL_ID}');
              fbq('track', 'PageView');`}
          </Script>
        )}
      </head>
      <body className="min-h-full bg-white font-sans text-steel-900 antialiased">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-brand-600 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
        >
          Saltar al contenido
        </a>
        {children}
      </body>
    </html>
  );
}
