import type { SiteSettings } from "@prisma/client";

// Genera la rampa de marca (--brand-50..700) desde un color base por instancia
// y la emite como CSS para inyectar en el <head> (sin FOUC). El color base es
// el tono principal (brand-500); los claros se mezclan con blanco y los oscuros
// con negro. Los stops replican la escala existente en globals.css (sin 400).

type Rgb = { r: number; g: number; b: number };

function parseHex(hex: string): Rgb | null {
  const h = hex.trim().replace(/^#/, "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) return null;
  return {
    r: parseInt(full.slice(0, 2), 16),
    g: parseInt(full.slice(2, 4), 16),
    b: parseInt(full.slice(4, 6), 16),
  };
}

function toHex({ r, g, b }: Rgb): string {
  const c = (n: number) => Math.round(Math.min(255, Math.max(0, n))).toString(16).padStart(2, "0");
  return `#${c(r)}${c(g)}${c(b)}`;
}

// amount > 0 mezcla con blanco (aclara); amount < 0 mezcla con negro (oscurece).
function shade(base: Rgb, amount: number): Rgb {
  const target = amount >= 0 ? 255 : 0;
  const p = Math.abs(amount);
  return {
    r: base.r + (target - base.r) * p,
    g: base.g + (target - base.g) * p,
    b: base.b + (target - base.b) * p,
  };
}

// Rampa neutra de respaldo (gris acero) si el color base es inválido: nunca
// caemos al rojo de una marca concreta.
const NEUTRAL_BASE = "#64717a";

export function generateBrandRamp(baseHex: string, darkHex?: string | null): Record<string, string> {
  const base = parseHex(baseHex) ?? parseHex(NEUTRAL_BASE)!;
  const dark = darkHex ? parseHex(darkHex) : null;
  return {
    "50": toHex(shade(base, 0.95)),
    "100": toHex(shade(base, 0.88)),
    "200": toHex(shade(base, 0.75)),
    "300": toHex(shade(base, 0.5)),
    "500": toHex(base),
    "600": dark ? toHex(dark) : toHex(shade(base, -0.12)),
    "700": dark ? toHex(shade(dark, -0.2)) : toHex(shade(base, -0.3)),
  };
}

export function brandThemeCss(settings: SiteSettings): string {
  const ramp = generateBrandRamp(settings.brandColor, settings.brandColorDark);
  const vars = Object.entries(ramp)
    .map(([stop, value]) => `--brand-${stop}:${value};`)
    .join("");
  return `:root{${vars}}`;
}
