import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getAllProductsForFeeds } from "@/lib/catalog";
import { listFeedExclusions } from "@/lib/feeds";

// GEO fase 3 §6.4: endpoint de validación — qué productos quedan fuera de
// cada feed y por qué. No público (son datos operativos del catálogo).
export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const products = await getAllProductsForFeeds();
  const { google, openai } = listFeedExclusions(products);

  return NextResponse.json({
    totalProducts: products.length,
    google: {
      excluidos: google.length,
      incluidos: products.length - google.length,
      detalle: google,
    },
    openai: {
      excluidos: openai.length,
      incluidos: products.length - openai.length,
      detalle: openai,
    },
  });
}
