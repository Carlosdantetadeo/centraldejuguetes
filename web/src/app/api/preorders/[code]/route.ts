import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Contrato para el agente de Kapso (prompt-frontend §7, "Función para el
// agente de Kapso"): input `codigo` (en la URL) → output JSON con items,
// total, distrito, regalo y estado. No busca interpretar texto libre —
// el agente solo necesita saber el código, que el cliente menciona en su
// mensaje de WhatsApp.
//
//   GET /api/preorders/P-10427
//   → { code, items, total, district, isGift, status, createdAt }
//   → 404 si el código no existe
//
// El código actúa como credencial (es aleatorio y no se puede enumerar),
// por eso no se exige autenticación adicional — mismo patrón que un
// "ver mi pedido" por número de orden.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;

  const preorder = await prisma.webPreorder.findUnique({
    where: { code },
    select: {
      code: true,
      items: true,
      total: true,
      district: true,
      isGift: true,
      status: true,
      createdAt: true,
    },
  });

  if (!preorder) {
    return NextResponse.json({ error: "Pedido no encontrado." }, { status: 404 });
  }

  return NextResponse.json(preorder);
}
