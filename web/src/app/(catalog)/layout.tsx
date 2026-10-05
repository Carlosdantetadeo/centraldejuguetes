import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { TopBar } from "@/components/layout/TopBar";
import { CartProvider } from "@/components/cart/CartProvider";
import { CartFab } from "@/components/cart/CartFab";
import { getSiteSettings } from "@/lib/settings";

export default async function CatalogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = await getSiteSettings();

  return (
    <CartProvider
      config={{
        whatsappNumber: settings.whatsappNumber,
        currency: settings.currency,
        locale: settings.locale,
      }}
    >
      <div className="flex min-h-full flex-col">
        <div className="sticky top-0 z-40">
          <TopBar />
          <Header />
        </div>
        <main className="flex-1">{children}</main>
        <Footer />
      </div>
      <CartFab />
    </CartProvider>
  );
}
