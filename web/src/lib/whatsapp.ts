import { getSiteUrl } from "@/lib/utils";

type WhatsAppProduct = {
  name: string;
  sku?: string | null;
  productUrl: string;
  available: boolean;
};

// CTA secundario de la ficha de producto: "Preguntar por WhatsApp" (con
// el SKU, para que el vendedor no tenga que adivinar de qué producto se
// trata). El flujo principal de cotización va por el carrito (CartFab).
export function buildWhatsAppUrl(
  product: WhatsAppProduct,
  whatsappNumber: string,
): string {
  const lines = [
    "¡Hola! 🧸 Tengo una pregunta sobre este producto:",
    `${product.name}${product.sku ? ` (Cód. ${product.sku})` : ""}`,
    `Ficha: ${product.productUrl}`,
    "",
    product.available
      ? "¿Me ayudan con mi consulta? ¡Gracias!"
      : "Vi que está sin stock, ¿cuándo tendrían disponibilidad?",
  ];
  return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(lines.join("\n"))}`;
}

export function getProductUrl(categorySlug: string, productSlug: string): string {
  return `${getSiteUrl()}/producto/${categorySlug}/${productSlug}`;
}
