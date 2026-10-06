"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export type SizeQty = { size: string; qty: number };

export type CartItem = {
  key: string; // `${categorySlug}/${productSlug}`
  id: string; // Product.id real — lo necesita el servidor para revalidar precio/stock
  categorySlug: string;
  productSlug: string;
  name: string;
  sku?: string | null;
  price: number;
  image?: string | null;
  sizes: SizeQty[];
};

export type CartConfig = {
  whatsappNumber: string;
  currency: string;
  locale: string;
};

type CartContextValue = {
  items: CartItem[];
  config: CartConfig;
  open: boolean;
  openCart: () => void;
  closeCart: () => void;
  addItem: (item: CartItem) => void;
  removeItem: (key: string) => void;
  clear: () => void;
  // Aplica precio/disponibilidad reales devueltos por POST /api/preorders
  // cuando algo cambió — quita lo que ya no hay y corrige precios.
  applyServerCorrections: (
    corrections: { productId: string; price: number; availableNow: boolean }[],
  ) => void;
  district: string;
  setDistrict: (value: string) => void;
  isGift: boolean;
  setIsGift: (value: boolean) => void;
};

const CartContext = createContext<CartContextValue | null>(null);
// localStorage (no sessionStorage): el prompt-frontend §7 pide que el
// pedido sobreviva entre visitas, no solo dentro de la misma pestaña.
const STORAGE_KEY = "cm_quote_cart_v3";
const DISTRICT_KEY = "cm_quote_district";
const GIFT_KEY = "cm_quote_gift";

function readLocalStorage(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeLocalStorage(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* ignore — privado/incógnito o storage lleno, no bloquea la compra */
  }
}

export function CartProvider({
  config,
  children,
}: {
  config: CartConfig;
  children: React.ReactNode;
}) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [district, setDistrict] = useState("");
  const [isGift, setIsGift] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [open, setOpen] = useState(false);

  // Cargar desde localStorage al montar (sobrevive entre visitas, no solo
  // dentro de la misma pestaña — a diferencia de sessionStorage).
  useEffect(() => {
    const raw = readLocalStorage(STORAGE_KEY);
    if (raw) {
      try {
        // Hidrata desde localStorage (sistema externo, no disponible en SSR).
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setItems(JSON.parse(raw));
      } catch {
        /* carrito corrupto, se ignora */
      }
    }
    setDistrict(readLocalStorage(DISTRICT_KEY) ?? "");
    setIsGift(readLocalStorage(GIFT_KEY) === "1");
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    writeLocalStorage(STORAGE_KEY, JSON.stringify(items));
  }, [items, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    writeLocalStorage(DISTRICT_KEY, district);
  }, [district, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    writeLocalStorage(GIFT_KEY, isGift ? "1" : "0");
  }, [isGift, hydrated]);

  const addItem = useCallback((item: CartItem) => {
    setItems((prev) => {
      const existing = prev.find((p) => p.key === item.key);
      if (existing) {
        // Mismo modelo: fusiona las tallas sumando las cantidades por talla.
        const map = new Map<string, number>();
        for (const s of existing.sizes) map.set(s.size, s.qty);
        for (const s of item.sizes)
          map.set(s.size, (map.get(s.size) ?? 0) + s.qty);
        const sizes = [...map].map(([size, qty]) => ({ size, qty }));
        return prev.map((p) => (p.key === item.key ? { ...p, sizes } : p));
      }
      return [...prev, item];
    });
  }, []);

  const removeItem = useCallback(
    (key: string) => setItems((prev) => prev.filter((p) => p.key !== key)),
    [],
  );

  const clear = useCallback(() => setItems([]), []);

  const applyServerCorrections = useCallback(
    (corrections: { productId: string; price: number; availableNow: boolean }[]) => {
      const byId = new Map(corrections.map((c) => [c.productId, c]));
      setItems((prev) =>
        prev
          .filter((item) => byId.get(item.id)?.availableNow !== false)
          .map((item) => {
            const correction = byId.get(item.id);
            return correction ? { ...item, price: correction.price } : item;
          }),
      );
    },
    [],
  );

  const openCart = useCallback(() => setOpen(true), []);
  const closeCart = useCallback(() => setOpen(false), []);

  return (
    <CartContext.Provider
      value={{
        items,
        config,
        open,
        openCart,
        closeCart,
        addItem,
        removeItem,
        clear,
        applyServerCorrections,
        district,
        setDistrict,
        isGift,
        setIsGift,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart debe usarse dentro de <CartProvider>.");
  return ctx;
}
