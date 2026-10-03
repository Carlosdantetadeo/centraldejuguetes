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
};

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "cm_quote_cart_v2";

export function CartProvider({
  config,
  children,
}: {
  config: CartConfig;
  children: React.ReactNode;
}) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [open, setOpen] = useState(false);

  // Cargar desde sessionStorage al montar (persistencia entre páginas/visitas).
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      /* ignore */
    }
  }, [items, hydrated]);

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
  const openCart = useCallback(() => setOpen(true), []);
  const closeCart = useCallback(() => setOpen(false), []);

  return (
    <CartContext.Provider
      value={{ items, config, open, openCart, closeCart, addItem, removeItem, clear }}
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
