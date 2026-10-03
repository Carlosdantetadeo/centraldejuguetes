import { formatPrice, getSiteUrl } from "@/lib/utils";

type WhatsAppProduct = {
  name: string;
  measure?: string | null;
  gauge?: string | null;
  price: number;
  priceTiers?: { label: string; amount: number }[] | null;
  productUrl: string;
  available: boolean;
  // Tallas/variantes que el usuario eligió en la ficha (multi-selección).
  selectedSizes?: string[];
};

// Config que viene de SiteSettings (ya no de env ni de constantes hardcodeadas).
type WhatsAppConfig = {
  whatsappNumber: string;
  priceLabel: string;
  currency: string;
  locale: string;
};

export function buildWhatsAppUrl(
  product: WhatsAppProduct,
  config: WhatsAppConfig,
): string {
  const specs = [product.measure, product.gauge].filter(Boolean).join(" · ");
  const amount = formatPrice(product.price, config.currency, config.locale);
  const fmt = (n: number) => formatPrice(n, config.currency, config.locale);
  const sizes = product.selectedSizes?.length
    ? product.selectedSizes.join(", ")
    : "";

  const lines = product.available
    ? [
        "¡Hola! 👟 Me interesa este modelo:",
        `Producto: ${product.name}`,
        specs ? `Medida/Calibre: ${specs}` : "",
        sizes ? `Tallas: ${sizes}` : "",
        `Precio referencial: ${amount}${config.priceLabel ? ` (${config.priceLabel})` : ""}`,
        ...(product.priceTiers ?? []).map((t) => `${t.label}: ${fmt(t.amount)}`),
        `Ficha: ${product.productUrl}`,
        "",
        "¿Me confirmas disponibilidad y precio final? ¡Gracias! 🙌",
      ]
    : [
        "¡Hola! 👟 Me interesa este modelo (vi que está sin stock):",
        `Producto: ${product.name}`,
        specs ? `Medida/Calibre: ${specs}` : "",
        sizes ? `Tallas de interés: ${sizes}` : "",
        `Ficha: ${product.productUrl}`,
        "",
        "¿Cuándo tendrían disponibilidad? ¡Gracias! 🙌",
      ];

  const message = lines.filter(Boolean).join("\n");
  return `https://wa.me/${config.whatsappNumber}?text=${encodeURIComponent(message)}`;
}

export function getProductUrl(categorySlug: string, productSlug: string): string {
  return `${getSiteUrl()}/producto/${categorySlug}/${productSlug}`;
}
