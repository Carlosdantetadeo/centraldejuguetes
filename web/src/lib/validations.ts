import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Ingresa un correo válido."),
  password: z.string().min(1, "Ingresa tu contraseña."),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Ingresa un correo válido."),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z
    .string()
    .min(10, "La contraseña debe tener al menos 10 caracteres."),
});

export const productSchema = z.object({
  name: z.string().min(2, "El nombre es obligatorio."),
  slug: z.string().optional(),
  description: z.string().optional(),
  brand: z.string().optional(),
  ageMin: z.coerce.number().int().min(0, "Edad inválida.").optional(),
  ageMax: z.coerce.number().int().min(0, "Edad inválida.").optional(),
  measure: z.string().optional(),
  gauge: z.string().optional(),
  material: z.string().optional(),
  price: z.coerce.number().nonnegative("Precio inválido.").default(0),
  stock: z.coerce.number().int().min(0, "Stock inválido."),
  available: z.coerce.boolean().default(true),
  featured: z.coerce.boolean().default(false),
  categoryId: z.string().min(1, "Selecciona una categoría."),
});

// Niveles de precio por unidad editables (rollo, metro, ciento…).
export const priceTierSchema = z
  .array(
    z.object({
      label: z.string().trim().min(1, "Cada precio necesita una etiqueta.").max(40),
      amount: z.coerce.number().nonnegative("Monto inválido."),
    }),
  )
  .max(12, "Máximo 12 precios por unidad.");

export const categorySchema = z.object({
  name: z.string().min(2, "El nombre es obligatorio."),
  slug: z.string().optional(),
  description: z.string().optional(),
  sortOrder: z.coerce.number().int().default(0),
  parentId: z.string().optional().nullable(),
});

const hexColor = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/, "Color inválido (usa formato #RRGGBB).");

// Campo de texto opcional: normaliza "" → null para no guardar cadenas vacías.
const optionalText = z
  .string()
  .trim()
  .transform((v) => (v === "" ? null : v))
  .nullable()
  .optional();

export const siteSettingsSchema = z.object({
  siteName: z.string().trim().min(1, "El nombre del sitio es obligatorio."),
  siteDescription: z.string().trim().min(1, "La descripción es obligatoria."),
  announcement: optionalText,
  brandColor: hexColor,
  brandColorDark: hexColor.optional().or(z.literal("")).transform((v) => v || null),
  whatsappNumber: z
    .string()
    .trim()
    .regex(/^[0-9]*$/, "Solo dígitos, con código de país (ej. 51999888777).")
    .transform((v) => (v === "" ? null : v))
    .nullable()
    .optional(),
  phone: optionalText,
  address: optionalText,
  socialFacebook: optionalText,
  socialInstagram: optionalText,
  socialTiktok: optionalText,
  footerTagline: optionalText,
  businessHours: optionalText,
  shippingNote: optionalText,
  paymentMethods: optionalText,
  currency: z.string().trim().length(3, "Usa el código ISO de 3 letras (ej. PEN)."),
  locale: z.string().trim().min(2, "Locale inválido (ej. es-PE)."),
  country: z.string().trim().min(2, "País inválido (ej. PE)."),
  priceLabel: z.string().trim().min(1, "La etiqueta de precio es obligatoria."),
  priceNote: z.string().trim().min(1, "La nota de precio es obligatoria."),
  legalEntity: optionalText,
  legalText: optionalText,
});

export const campaignSchema = z.object({
  title: z.string().trim().min(2, "El título es obligatorio."),
  subtitle: optionalText,
  ctaLabel: optionalText,
  ctaUrl: optionalText,
  startsAt: z.coerce.date({ message: "Fecha de inicio inválida." }),
  endsAt: z.coerce.date({ message: "Fecha de fin inválida." }),
  active: z.coerce.boolean().default(true),
});

export const faqItemSchema = z.object({
  question: z.string().trim().min(5, "La pregunta es obligatoria."),
  answer: z.string().trim().min(5, "La respuesta es obligatoria."),
  sortOrder: z.coerce.number().int().default(0),
});

export const imageAltSchema = z.object({
  altText: z.string().min(3, "La descripción de la imagen es obligatoria."),
});

// CSV bulk import: name,category,measure,gauge,material,price,stock,description
export const bulkImportSchema = z.array(
  z.object({
    name: z.string().min(2),
    category: z.string().min(1),
    measure: z.string().optional().nullable(),
    gauge: z.string().optional().nullable(),
    material: z.string().optional().nullable(),
    price: z.coerce.number().nonnegative().default(0),
    stock: z.coerce.number().int().min(0).default(0),
    description: z.string().optional().nullable(),
    brand: z.string().optional().nullable(),
    age_min: z.coerce.number().int().min(0).optional().nullable(),
    age_max: z.coerce.number().int().min(0).optional().nullable(),
  }),
);
