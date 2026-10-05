import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { preorderSchema } from "@/lib/validations";

function generateCode(): string {
  const n = Math.floor(10000 + Math.random() * 90000); // P-10000..P-99999
  return `P-${n}`;
}

// Pre-pedido (prompt-frontend §7). Flujo:
// 1. Revalida precio/stock de cada item contra la DB (nunca confía en lo
//    que mandó el navegador).
// 2. Si algo cambió, NO inserta — devuelve los valores reales para que
//    el cliente avise antes de reintentar.
// 3. Si todo coincide, inserta el pre-pedido con un código único y lo
//    devuelve. El cliente abre WhatsApp con ese código; si esta ruta
//    falla por cualquier motivo, el cliente abre WhatsApp igual (nunca
//    bloquear la venta — eso se maneja en el cliente, no aquí).
export async function POST(request: Request) {
  const ip = getClientIp(request);
  if (!checkRateLimit(`preorder:${ip}`, { limit: 10, windowMs: 60_000 })) {
    return NextResponse.json({ error: "Demasiados intentos, espera un momento." }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const parsed = preorderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos." },
      { status: 400 },
    );
  }

  const { items, district, isGift, utmSource, utmMedium, utmCampaign, fbclid, gclid } = parsed.data;

  const products = await prisma.product.findMany({
    where: { id: { in: items.map((i) => i.productId) } },
    select: { id: true, name: true, sku: true, price: true, available: true, stock: true },
  });
  const byId = new Map(products.map((p) => [p.id, p]));

  let changed = false;
  const resolvedItems = items.map((item) => {
    const product = byId.get(item.productId);
    if (!product) {
      changed = true;
      return { ...item, name: "Producto no encontrado", price: 0, availableNow: false };
    }
    const availableNow = product.available && product.stock >= item.qty;
    const priceChanged = product.price !== item.price;
    if (!availableNow || priceChanged) changed = true;
    return {
      productId: item.productId,
      name: product.name,
      sku: product.sku,
      qty: item.qty,
      price: product.price,
      previousPrice: priceChanged ? item.price : undefined,
      availableNow,
    };
  });

  if (changed) {
    return NextResponse.json({ ok: false, changed: true, items: resolvedItems });
  }

  const total = resolvedItems.reduce((sum, i) => sum + i.price * i.qty, 0);

  // Reintenta unas pocas veces si el código random colisiona (muy raro).
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateCode();
    try {
      await prisma.webPreorder.create({
        data: {
          code,
          items: resolvedItems,
          total,
          district,
          isGift,
          utmSource,
          utmMedium,
          utmCampaign,
          fbclid,
          gclid,
        },
      });
      return NextResponse.json({ ok: true, code });
    } catch (err) {
      const isUniqueViolation =
        typeof err === "object" && err !== null && "code" in err && err.code === "P2002";
      if (!isUniqueViolation) {
        return NextResponse.json({ ok: false, error: "No se pudo registrar el pedido." }, { status: 500 });
      }
    }
  }

  return NextResponse.json({ ok: false, error: "No se pudo generar un código único." }, { status: 500 });
}
