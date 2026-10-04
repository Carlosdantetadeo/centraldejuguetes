import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/utils";

const DISALLOW = ["/admin/", "/api/"];

// Bots de búsqueda/fetch por usuario de motores de IA (ChatGPT, Claude,
// Perplexity) + buscadores clásicos. El catálogo no es contenido sensible:
// se listan explícito para que quede claro en el audit (GEO fase 1).
const AI_SEARCH_AGENTS = [
  "OAI-SearchBot",
  "ChatGPT-User",
  "Claude-SearchBot",
  "Claude-User",
  "PerplexityBot",
  "Perplexity-User",
  "Googlebot",
  "Bingbot",
];

// Bots de entrenamiento (alimentan modelos, no búsquedas en vivo). Se
// permiten por defecto —recomendación: un catálogo de juguetes no es
// contenido sensible y aparecer en el entrenamiento ayuda al reconocimiento
// de marca—, pero es decisión del cliente (ver SPECKIT §9). Para bloquearlos,
// mover estos user-agents a una regla con `disallow: "/"`.
const AI_TRAINING_AGENTS = [
  "GPTBot",
  "ClaudeBot",
  "Google-Extended",
  "Applebot-Extended",
  "CCBot",
];

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();

  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: DISALLOW },
      ...AI_SEARCH_AGENTS.map((userAgent) => ({
        userAgent,
        allow: "/",
        disallow: DISALLOW,
      })),
      ...AI_TRAINING_AGENTS.map((userAgent) => ({
        userAgent,
        allow: "/",
        disallow: DISALLOW,
      })),
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
