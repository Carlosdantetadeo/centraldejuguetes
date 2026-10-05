import { NextRequest, NextResponse, NextFetchEvent } from "next/server";
import { jwtVerify } from "jose";
import { AI_SEARCH_AGENTS, AI_TRAINING_AGENTS, SESSION_COOKIE } from "@/lib/constants";
import { prisma } from "@/lib/db";

const publicAdminPaths = [
  "/admin/login",
  "/admin/olvidar-contrasena",
  "/admin/restablecer-contrasena",
];

const ALL_KNOWN_BOTS = [...AI_SEARCH_AGENTS, ...AI_TRAINING_AGENTS];

function matchBotName(userAgent: string): string | null {
  return ALL_KNOWN_BOTS.find((bot) => userAgent.includes(bot)) ?? null;
}

// GEO fase 5 §3: registra la visita sin bloquear la respuesta. No hay
// `status` real porque el proxy corre antes del render — acá solo se ve
// que la request entró, no cómo la respondió la página.
async function logBotVisit(botName: string, userAgent: string, path: string) {
  try {
    await prisma.botVisit.create({ data: { botName, userAgent, path } });
  } catch {
    // Un log de analítica no debe tirar la request abajo.
  }
}

export async function proxy(request: NextRequest, event: NextFetchEvent) {
  const { pathname } = request.nextUrl;

  const userAgent = request.headers.get("user-agent") ?? "";
  const botName = matchBotName(userAgent);
  if (botName) {
    // Next 16: proxy corre en runtime Node.js por defecto → Prisma
    // funciona directo, sin driver especial. waitUntil() para no
    // retrasar la respuesta al bot.
    event.waitUntil(logBotVisit(botName, userAgent, pathname));
  }

  if (!pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  if (publicAdminPaths.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  try {
    const secret = process.env.AUTH_SECRET;
    if (!secret) throw new Error("Missing AUTH_SECRET");
    await jwtVerify(token, new TextEncoder().encode(secret));
    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }
}

export const config = {
  matcher: [
    // Todo excepto assets estáticos — así el log de bots cubre home,
    // categorías, productos, no solo /admin.
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
