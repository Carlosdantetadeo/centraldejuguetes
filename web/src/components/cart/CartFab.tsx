"use client";

import { useEffect, useState } from "react";
import { useCart } from "@/components/cart/CartProvider";
import { formatPrice, getSiteUrl } from "@/lib/utils";
import { getStoredUtm } from "@/lib/utm";
import { trackViewCart, trackWhatsappOrder } from "@/lib/analytics";

export function CartFab() {
  const {
    items,
    config,
    removeItem,
    clear,
    open,
    openCart,
    closeCart,
    district,
    setDistrict,
    isGift,
    setIsGift,
    applyServerCorrections,
  } = useCart();
  const [sending, setSending] = useState(false);
  const [warning, setWarning] = useState<string | null>(null);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (!open || items.length === 0) return;
    const total = items.reduce(
      (sum, it) => sum + it.price * it.sizes.reduce((a, s) => a + s.qty, 0),
      0,
    );
    trackViewCart(
      items.map((it) => ({ id: it.id, name: it.name, price: it.price })),
      total,
      config.currency,
    );
  }, [open, items, config.currency]);

  if (items.length === 0) return null;

  const siteUrl = getSiteUrl();
  const totalItems = items.reduce(
    (n, it) => n + it.sizes.reduce((a, s) => a + s.qty, 0),
    0,
  );

  function buildMessage(code?: string): string {
    const lines = [
      "¡Hola! 🧸 Quiero cotizar estos productos que elegí:",
      code ? `Pedido #${code}` : "",
      "",
      ...items.map((it) => {
        const cantInfo = it.sizes.length
          ? ` — ${it.sizes.map((s) => `${s.size} ×${s.qty}`).join(", ")}`
          : "";
        const skuInfo = it.sku ? ` (Cód. ${it.sku})` : "";
        const price = formatPrice(it.price, config.currency, config.locale);
        return `• ${it.name}${skuInfo}${cantInfo} — ${price}\n  ${siteUrl}/producto/${it.categorySlug}/${it.productSlug}`;
      }),
      "",
      district ? `Entrega: ${district}` : "",
      isGift ? "Es para regalo 🎁 (envolver, por favor)" : "",
      `🛒 ${items.length} ${items.length === 1 ? "producto" : "productos"} · ${totalItems} ${totalItems === 1 ? "ítem" : "ítems"} en total.`,
      "¿Me confirman disponibilidad y precio final? ¡Gracias! 🙌",
    ];
    return lines.filter(Boolean).join("\n");
  }

  function openWhatsApp(code?: string) {
    const total = items.reduce(
      (sum, it) => sum + it.price * it.sizes.reduce((a, s) => a + s.qty, 0),
      0,
    );
    trackWhatsappOrder(total, config.currency, code);
    window.open(
      `https://wa.me/${config.whatsappNumber}?text=${encodeURIComponent(buildMessage(code))}`,
      "_blank",
      "noopener,noreferrer",
    );
  }

  async function handleSend() {
    setSending(true);
    setWarning(null);
    try {
      const res = await fetch("/api/preorders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((it) => ({
            productId: it.id,
            qty: it.sizes.reduce((n, s) => n + s.qty, 0),
            price: it.price,
          })),
          district: district || undefined,
          isGift,
          ...getStoredUtm(),
        }),
      });
      const data = await res.json().catch(() => null);

      if (data?.changed) {
        applyServerCorrections(data.items);
        setWarning(
          "Actualizamos precios o disponibilidad de tu pedido — revísalo antes de enviarlo de nuevo.",
        );
        return;
      }
      // ok:true → código real; cualquier otra cosa (500, red caída) →
      // se abre igual, sin código. Nunca se bloquea la venta.
      openWhatsApp(data?.ok ? data.code : undefined);
    } catch {
      openWhatsApp();
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      {/* Botón flotante */}
      <button
        onClick={openCart}
        aria-label={`Ver cotización (${items.length} productos)`}
        className="fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full bg-brand-600 px-5 py-3.5 text-sm font-semibold text-white shadow-xl shadow-brand-600/30 transition-all hover:bg-brand-700 hover:shadow-2xl"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-2" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121 0 2.1-.744 2.4-1.822l1.03-3.706A1.125 1.125 0 0 0 20.03 7.5H5.106M7.5 14.25 5.106 7.5M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
        </svg>
        Mi cotización
        <span className="flex h-6 min-w-[1.5rem] items-center justify-center rounded-full bg-white px-1.5 text-xs font-bold text-brand-700">
          {items.length}
        </span>
      </button>

      {/* Backdrop */}
      <div
        aria-hidden
        onClick={closeCart}
        className={`fixed inset-0 z-40 bg-black/40 transition-opacity duration-300 ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      {/* Drawer */}
      <div
        role="dialog"
        aria-modal
        aria-label="Cotización"
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-sm flex-col bg-white shadow-2xl transition-transform duration-300 ease-in-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-steel-100 px-4 py-3">
          <span className="font-display text-sm font-bold text-steel-900">
            Mi cotización
            <span className="ml-1.5 font-normal text-steel-400">
              ({items.length} {items.length === 1 ? "producto" : "productos"})
            </span>
          </span>
          <button
            onClick={closeCart}
            aria-label="Cerrar"
            className="flex h-8 w-8 items-center justify-center rounded-full text-steel-400 transition-colors hover:bg-steel-100 hover:text-steel-900"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-2" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          <ul className="space-y-2">
            {items.map((it) => (
              <li
                key={it.key}
                className="flex gap-3 rounded-xl border border-steel-200 bg-white p-3"
              >
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-steel-200 bg-white">
                  {it.image ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={it.image} alt={it.name} className="h-full w-full object-contain p-1" />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-steel-900">{it.name}</p>
                  {it.sku && (
                    <p className="font-mono text-[10px] font-medium text-brand-600">
                      {it.sku}
                    </p>
                  )}
                  <p className="mt-0.5 font-mono text-sm text-steel-700">
                    {formatPrice(it.price, config.currency, config.locale)}
                  </p>
                  {it.sizes.length > 0 && (
                    <p className="mt-1 text-xs text-steel-500">
                      Cantidad:{" "}
                      <span className="font-medium text-steel-700">
                        {it.sizes.map((s) => `${s.size} ×${s.qty}`).join(", ")}
                      </span>
                    </p>
                  )}
                </div>
                <button
                  onClick={() => removeItem(it.key)}
                  aria-label={`Quitar ${it.name}`}
                  className="self-start text-steel-300 transition-colors hover:text-red-500"
                >
                  <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-2" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </li>
            ))}
          </ul>

          <button
            onClick={clear}
            className="mt-3 text-xs font-medium text-steel-500 underline-offset-2 hover:text-red-600 hover:underline"
          >
            Vaciar cotización
          </button>

          {/* Distrito/ciudad de entrega + regalo (prompt-frontend §7) */}
          <div className="mt-4 space-y-3 rounded-xl border border-steel-200 bg-steel-50 p-3">
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-steel-600">
                Distrito o ciudad de entrega (opcional)
              </span>
              <input
                type="text"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                placeholder="Ej: Surco, Lima"
                className="w-full rounded-lg border border-steel-300 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </label>
            <label className="flex cursor-pointer items-center gap-2.5 text-sm text-steel-700">
              <input
                type="checkbox"
                checked={isGift}
                onChange={(e) => setIsGift(e.target.checked)}
                className="h-4 w-4 rounded border-steel-300 text-brand-600 focus:ring-brand-500"
              />
              Es para regalo (envolver)
            </label>
          </div>

          {warning && (
            <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-800">
              {warning}
            </div>
          )}
        </div>

        <div className="border-t border-steel-100 p-4">
          <button
            type="button"
            onClick={handleSend}
            disabled={sending}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-whatsapp px-6 py-3.5 text-base font-semibold text-white shadow-lg shadow-whatsapp/20 transition-all hover:bg-whatsapp-dark hover:shadow-xl disabled:opacity-60"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden>
              <path d="M17.47 14.38c-.29-.15-1.71-.84-1.97-.94-.26-.1-.46-.15-.65.15-.19.29-.75.94-.92 1.13-.17.19-.34.22-.63.07-.29-.15-1.22-.45-2.33-1.43-.86-.77-1.44-1.72-1.61-2.01-.17-.29-.02-.45.13-.59.13-.13.29-.34.44-.51.15-.17.19-.29.29-.48.1-.19.05-.36-.02-.51-.07-.15-.65-1.57-.89-2.15-.24-.57-.48-.49-.65-.5-.17-.01-.36-.01-.55-.01-.19 0-.51.07-.77.36-.26.29-1.01.99-1.01 2.41 0 1.42 1.03 2.79 1.18 2.98.15.19 2.03 3.1 4.92 4.35.69.3 1.22.47 1.64.6.69.22 1.31.19 1.81.12.55-.08 1.71-.7 1.95-1.37.24-.67.24-1.25.17-1.37-.07-.12-.26-.19-.55-.34zM12.04 2.5A9.5 9.5 0 0 0 2.55 12c0 1.67.44 3.31 1.27 4.75L2.5 21.5l4.87-1.28A9.46 9.46 0 0 0 12.04 21.5 9.5 9.5 0 0 0 21.5 12 9.5 9.5 0 0 0 12.04 2.5z" />
            </svg>
            {sending ? "Enviando…" : "Enviar pedido por WhatsApp"}
          </button>
        </div>
      </div>
    </>
  );
}
