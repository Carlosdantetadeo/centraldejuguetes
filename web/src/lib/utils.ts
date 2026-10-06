export function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Moneda y locale por instancia (SiteSettings). Defaults neutros para no
// romper si algún llamador no los pasa aún.
export function formatPrice(
  amount: number,
  currency = "PEN",
  locale = "es-PE",
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

export function normalizeSearch(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

const TITLE_CASE_LOWERCASE_WORDS = new Set([
  "de", "del", "la", "el", "los", "las", "y", "en", "con", "por", "para", "al", "a",
]);

// Los nombres vienen tal cual del catálogo del proveedor: todo en mayúsculas
// y a veces con un código entre paréntesis al inicio que duplica el SKU
// (ej. "(W12806) WELLY MOTOS  16 MODELOS"). Esto solo reformatea la
// presentación — nunca inventa ni recorta información del nombre real.
export function formatProductName(name: string): string {
  const collapsed = name.trim().replace(/\s+/g, " ");
  const withoutCode = collapsed.replace(/^\([A-Z0-9-]+\)\s+(?=\S)/, "");

  return withoutCode
    .split(" ")
    .map((word, i) => {
      if (/\d/.test(word)) return word;
      const lower = word.toLocaleLowerCase("es");
      if (i > 0 && TITLE_CASE_LOWERCASE_WORDS.has(lower)) return lower;
      return lower.charAt(0).toLocaleUpperCase("es") + lower.slice(1);
    })
    .join(" ");
}

export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

export function getSiteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}
