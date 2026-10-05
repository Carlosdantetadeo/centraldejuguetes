// Identidad, marca, etiquetas de precio, contacto y categorías viven ahora en
// la DB (SiteSettings + Category), editables desde el panel. La plantilla no
// hardcodea datos de ninguna empresa — ver docs/03-spec-plantilla.md.

export const SESSION_COOKIE = "cm_session";
export const SESSION_MAX_AGE_DAYS = 30;
export const RESET_TOKEN_HOURS = 1;

// Rangos de filtro del catálogo (PLP/home) — buckets estructurales, no
// datos de ningún cliente. Compartidos entre page.tsx (home), categoria/
// [slug]/page.tsx y FilterSidebar para no duplicar los valores.
export const PRICE_RANGES = [
  { value: "0-50", label: "Hasta S/ 50", min: 0, max: 50 },
  { value: "50-200", label: "S/ 50 – S/ 200", min: 50, max: 200 },
  { value: "200-500", label: "S/ 200 – S/ 500", min: 200, max: 500 },
  { value: "500-99999", label: "Más de S/ 500", min: 500, max: 99999 },
] as const;

// Comprar por edad (prompt-frontend §4.4): filtra por solapamiento de
// rango — un producto entra si [ageMin, ageMax] se cruza con la franja.
export const AGE_RANGES = [
  { value: "0-2", label: "0–2 años", min: 0, max: 2 },
  { value: "3-5", label: "3–5 años", min: 3, max: 5 },
  { value: "6-8", label: "6–8 años", min: 6, max: 8 },
  { value: "9-12", label: "9–12 años", min: 9, max: 12 },
  { value: "13-99", label: "13+ años", min: 13, max: 99 },
] as const;

export const SORT_OPTIONS = [
  { value: "vendidos", label: "Más vendidos" },
  { value: "precio-asc", label: "Menor precio" },
  { value: "precio-desc", label: "Mayor precio" },
  { value: "nuevos", label: "Novedades" },
] as const;

export const PAGE_SIZE = 24;

// Bots de búsqueda/fetch por usuario de motores de IA + buscadores
// clásicos (GEO fase 1: robots.ts los permite explícito; GEO fase 5:
// proxy.ts registra sus visitas — ver src/app/admin/(protected)/bots).
export const AI_SEARCH_AGENTS = [
  "OAI-SearchBot",
  "ChatGPT-User",
  "Claude-SearchBot",
  "Claude-User",
  "PerplexityBot",
  "Perplexity-User",
  "Googlebot",
  "Bingbot",
] as const;

// Bots de entrenamiento (alimentan modelos, no búsquedas en vivo). Se
// permiten por defecto en robots.ts — decisión del cliente, ver SPECKIT §9.
export const AI_TRAINING_AGENTS = [
  "GPTBot",
  "ClaudeBot",
  "Google-Extended",
  "Applebot-Extended",
  "CCBot",
] as const;

// Dominios de motores de IA que generan tráfico vía link directo (no
// bot/crawler, sino un humano haciendo clic en una respuesta de chat).
// GEO fase 5 §2: se usan para atribuir pre-pedidos a tráfico de IA
// aunque no venga con utm_source explícito.
export const AI_REFERRER_DOMAINS = [
  "chatgpt.com",
  "chat.openai.com",
  "perplexity.ai",
  "gemini.google.com",
  "copilot.microsoft.com",
  "claude.ai",
] as const;
