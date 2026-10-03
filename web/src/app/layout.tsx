import type { Metadata, Viewport } from "next";
import { Archivo, DM_Sans, JetBrains_Mono } from "next/font/google";
import { getSiteSettings } from "@/lib/settings";
import { brandThemeCss } from "@/lib/theme";
import "./globals.css";

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
      </head>
      <body className="min-h-full bg-white font-sans text-steel-900 antialiased">
        {children}
      </body>
    </html>
  );
}
