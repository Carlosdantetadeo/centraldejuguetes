// Eventos de GA4 + Meta Pixel (prompt-frontend §8). No hace nada si no
// hay NEXT_PUBLIC_GA4_ID / NEXT_PUBLIC_META_PIXEL_ID configurados — los
// <Script> que cargan gtag/fbq solo se inyectan en ese caso (ver
// src/app/layout.tsx), así que `window.gtag`/`window.fbq` simplemente no
// existen todavía en la plantilla neutra y estas llamadas son no-ops.
declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
  }
}

type Item = { id: string; name: string; price: number; quantity?: number };

function ga4(eventName: string, params: Record<string, unknown>) {
  window.gtag?.("event", eventName, params);
}

function pixelStandard(eventName: string, params: Record<string, unknown>) {
  window.fbq?.("track", eventName, params);
}

function pixelCustom(eventName: string, params: Record<string, unknown>) {
  window.fbq?.("trackCustom", eventName, params);
}

export function trackViewItem(item: Item, currency: string) {
  ga4("view_item", { currency, value: item.price, items: [item] });
  pixelStandard("ViewContent", {
    content_ids: [item.id],
    content_name: item.name,
    value: item.price,
    currency,
  });
}

export function trackAddToCart(item: Item, currency: string) {
  ga4("add_to_cart", { currency, value: item.price * (item.quantity ?? 1), items: [item] });
  pixelStandard("AddToCart", {
    content_ids: [item.id],
    content_name: item.name,
    value: item.price * (item.quantity ?? 1),
    currency,
  });
}

export function trackViewCart(items: Item[], total: number, currency: string) {
  ga4("view_cart", { currency, value: total, items });
  pixelStandard("InitiateCheckout", {
    content_ids: items.map((i) => i.id),
    value: total,
    currency,
  });
}

// Evento custom — es la conversión real de este negocio (no hay checkout,
// el pedido se cierra en WhatsApp).
export function trackWhatsappOrder(total: number, currency: string, code?: string) {
  ga4("whatsapp_order", { currency, value: total, preorder_code: code });
  pixelCustom("whatsapp_order", { value: total, currency, preorder_code: code });
}

export function trackWhatsappQuestion(item: Item, currency: string) {
  ga4("whatsapp_question", { currency, value: item.price, items: [item] });
  pixelCustom("whatsapp_question", {
    content_ids: [item.id],
    content_name: item.name,
    currency,
  });
}
