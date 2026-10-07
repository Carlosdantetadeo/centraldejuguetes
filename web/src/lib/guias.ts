import guiasData from "@/content/guias-aeo.json";

export type GuideTableCell = string | { texto: string; slug: string };

export type Guide = {
  slug: string;
  categoria: string;
  meta_titulo: string;
  meta_descripcion: string;
  h1: string;
  respuesta_directa: string;
  tabla?: {
    titulo: string;
    columnas: string[];
    filas: GuideTableCell[][];
  };
  secciones: {
    h2: string;
    parrafo: string;
    productos: string[];
  }[];
  consejos: string[];
  faq: { q: string; a: string }[];
  enlaces_internos: string[];
  productos_citados: string[];
};

const guides = guiasData as Guide[];

export function getAllGuides(): Guide[] {
  return guides;
}

export function getGuideBySlug(slug: string): Guide | undefined {
  return guides.find((g) => g.slug === slug);
}
