import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// US-14: registra una vista de producto. Se llama como beacon fire-and-forget
// desde la ficha (ProductViewTracker), no desde el render — la ficha usa ISR
// (revalidate = 60), así que contar en el render solo registraría 1 vista por
// regeneración de caché, no por visita real.
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    // Incremento atómico en un solo UPDATE (SET vistas = vistas + 1),
    // sin select+update previo — evita condiciones de carrera.
    await prisma.product.update({
      where: { id },
      data: { vistas: { increment: 1 } },
    });
  } catch {
    // Producto inexistente u otro error: no rompemos la experiencia del
    // visitante por un contador de analítica.
    return NextResponse.json({ ok: false });
  }

  return NextResponse.json({ ok: true });
}
