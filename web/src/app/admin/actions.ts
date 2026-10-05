"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { deleteImageFiles, uploadBrandingAsset } from "@/lib/images";
import { slugify } from "@/lib/utils";
import {
  campaignSchema,
  categorySchema,
  faqItemSchema,
  geoQuerySchema,
  priceTierSchema,
  productSchema,
  siteSettingsSchema,
  testimonialSchema,
} from "@/lib/validations";

function revalidateCatalog() {
  revalidatePath("/");
  revalidatePath("/buscar");
  revalidatePath("/categoria/[slug]", "page");
  revalidatePath("/producto/[categorySlug]/[productSlug]", "page");
}

export async function saveProductAction(formData: FormData) {
  await requireAdmin();

  const parsed = productSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug") || undefined,
    description: formData.get("description") || undefined,
    brand: formData.get("brand") || undefined,
    ageMin: formData.get("ageMin") || undefined,
    ageMax: formData.get("ageMax") || undefined,
    safetyWarnings: formData.get("safetyWarnings") || undefined,
    batteriesIncluded: formData.get("batteriesIncluded") || undefined,
    boxContents: formData.get("boxContents") || undefined,
    videoUrl: formData.get("videoUrl") || undefined,
    measure: formData.get("measure") || undefined,
    gauge: formData.get("gauge") || undefined,
    material: formData.get("material") || undefined,
    price: formData.get("price") || 0,
    stock: formData.get("stock"),
    available: formData.get("available") === "on",
    featured: formData.get("featured") === "on",
    categoryId: formData.get("categoryId"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }

  // Niveles de precio por unidad (JSON desde el formulario).
  let priceTiers: { label: string; amount: number }[] = [];
  const rawTiers = formData.get("priceTiers")?.toString();
  if (rawTiers) {
    try {
      const parsedTiers = priceTierSchema.safeParse(JSON.parse(rawTiers));
      if (!parsedTiers.success) {
        return { error: parsedTiers.error.issues[0]?.message ?? "Precios por unidad inválidos." };
      }
      priceTiers = parsedTiers.data;
    } catch {
      return { error: "Precios por unidad inválidos." };
    }
  }

  // batteriesIncluded es tri-estado (sí/no/no especificado): el select
  // llega como string, se convierte a boolean|null fuera del schema.
  const { batteriesIncluded: batteriesRaw, ...rest } = parsed.data;
  const batteriesIncluded =
    batteriesRaw === "true" ? true : batteriesRaw === "false" ? false : null;

  const data = rest;
  const slug = data.slug?.trim() || slugify(data.name);
  const productId = formData.get("productId")?.toString();
  // Array cuando hay niveles; DbNull para limpiar la columna cuando no.
  const tiersData = priceTiers.length > 0 ? priceTiers : Prisma.DbNull;

  if (productId) {
    await prisma.product.update({
      where: { id: productId },
      data: { ...data, slug, batteriesIncluded, priceTiers: tiersData },
    });
  } else {
    await prisma.product.create({
      data: { ...data, slug, batteriesIncluded, priceTiers: tiersData },
    });
  }

  revalidateCatalog();
  redirect("/admin/productos");
}

export async function deleteProductAction(formData: FormData) {
  await requireAdmin();
  const productId = formData.get("productId")?.toString();
  if (!productId) return;

  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: { images: true },
  });

  if (product) {
    await deleteImageFiles(
      product.images.flatMap((image) => [
        image.pathFull,
        image.pathMedium,
        image.pathThumb,
        image.pathJpegFull,
      ]),
    );
    await prisma.product.delete({ where: { id: productId } });
  }

  revalidateCatalog();
  redirect("/admin/productos");
}

export async function saveCategoryAction(formData: FormData) {
  await requireAdmin();

  const parsed = categorySchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug") || undefined,
    description: formData.get("description") || undefined,
    sortOrder: formData.get("sortOrder") || 0,
    parentId: formData.get("parentId") || null,
  });

  if (!parsed.success) {
    redirect("/admin/categorias?error=invalid");
  }

  const data = parsed.data;
  const slug = data.slug?.trim() || slugify(data.name);
  const categoryId = formData.get("categoryId")?.toString();

  // Imagen de categoría (opcional): se sube a Storage si viene un archivo.
  let imageUrl: string | undefined;
  const image = formData.get("image");
  if (image instanceof File && image.size > 0 && image.type.startsWith("image/")) {
    try {
      const buffer = Buffer.from(await image.arrayBuffer());
      imageUrl = await uploadBrandingAsset(buffer, `categoria-${slug}-${Date.now()}`, image.type);
    } catch {
      redirect("/admin/categorias?error=invalid");
    }
  }

  if (categoryId) {
    await prisma.category.update({
      where: { id: categoryId },
      data: {
        ...data,
        slug,
        parentId: data.parentId || null,
        ...(imageUrl ? { imageUrl } : {}),
      },
    });
  } else {
    await prisma.category.create({
      data: {
        ...data,
        slug,
        parentId: data.parentId || null,
        ...(imageUrl ? { imageUrl } : {}),
      },
    });
  }

  revalidateCatalog();
  redirect("/admin/categorias");
}

export async function deleteCategoryAction(formData: FormData) {
  await requireAdmin();
  const categoryId = formData.get("categoryId")?.toString();
  if (!categoryId) return;

  const productCount = await prisma.product.count({ where: { categoryId } });
  if (productCount > 0) {
    redirect("/admin/categorias?error=has-products");
  }

  const childrenCount = await prisma.category.count({ where: { parentId: categoryId } });
  if (childrenCount > 0) {
    redirect("/admin/categorias?error=has-children");
  }

  await prisma.category.delete({ where: { id: categoryId } });
  revalidateCatalog();
  redirect("/admin/categorias");
}

export type SettingsFormState = { ok?: boolean; error?: string };

export async function saveSettingsAction(
  _prev: SettingsFormState,
  formData: FormData,
): Promise<SettingsFormState> {
  await requireAdmin();

  const parsed = siteSettingsSchema.safeParse({
    siteName: formData.get("siteName"),
    siteDescription: formData.get("siteDescription"),
    announcement: formData.get("announcement") ?? "",
    brandColor: formData.get("brandColor"),
    brandColorDark: formData.get("brandColorDark") ?? "",
    whatsappNumber: formData.get("whatsappNumber") ?? "",
    phone: formData.get("phone") ?? "",
    address: formData.get("address") ?? "",
    socialFacebook: formData.get("socialFacebook") ?? "",
    socialInstagram: formData.get("socialInstagram") ?? "",
    socialTiktok: formData.get("socialTiktok") ?? "",
    footerTagline: formData.get("footerTagline") ?? "",
    businessHours: formData.get("businessHours") ?? "",
    shippingNote: formData.get("shippingNote") ?? "",
    paymentMethods: formData.get("paymentMethods") ?? "",
    currency: formData.get("currency"),
    locale: formData.get("locale"),
    country: formData.get("country"),
    priceLabel: formData.get("priceLabel"),
    priceNote: formData.get("priceNote"),
    legalEntity: formData.get("legalEntity") ?? "",
    legalText: formData.get("legalText") ?? "",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }

  const data = parsed.data;

  // Logo opcional: si se subió un archivo nuevo, lo guardamos en Storage.
  let logoUrl: string | undefined;
  const logo = formData.get("logo");
  if (logo instanceof File && logo.size > 0) {
    if (!logo.type.startsWith("image/")) {
      return { error: "El logo debe ser una imagen." };
    }
    try {
      const buffer = Buffer.from(await logo.arrayBuffer());
      logoUrl = await uploadBrandingAsset(buffer, `logo-${Date.now()}`, logo.type);
    } catch {
      return { error: "No se pudo subir el logo. Intenta de nuevo." };
    }
  }

  // Imagen de fondo del hero (opcional).
  let heroImageUrl: string | undefined;
  const heroImage = formData.get("heroImage");
  if (heroImage instanceof File && heroImage.size > 0) {
    if (!heroImage.type.startsWith("image/")) {
      return { error: "La imagen del hero debe ser una imagen." };
    }
    try {
      const buffer = Buffer.from(await heroImage.arrayBuffer());
      heroImageUrl = await uploadBrandingAsset(buffer, `hero-${Date.now()}`, heroImage.type);
    } catch {
      return { error: "No se pudo subir la imagen del hero. Intenta de nuevo." };
    }
  }

  await prisma.siteSettings.update({
    where: { id: "default" },
    data: {
      siteName: data.siteName,
      siteDescription: data.siteDescription,
      announcement: data.announcement ?? null,
      brandColor: data.brandColor,
      brandColorDark: data.brandColorDark,
      whatsappNumber: data.whatsappNumber ?? "",
      phone: data.phone ?? null,
      address: data.address ?? null,
      socialFacebook: data.socialFacebook ?? null,
      socialInstagram: data.socialInstagram ?? null,
      socialTiktok: data.socialTiktok ?? null,
      footerTagline: data.footerTagline ?? null,
      currency: data.currency.toUpperCase(),
      locale: data.locale,
      country: data.country.toUpperCase(),
      priceLabel: data.priceLabel,
      priceNote: data.priceNote,
      legalEntity: data.legalEntity ?? null,
      legalText: data.legalText ?? null,
      ...(logoUrl ? { logoUrl } : {}),
      ...(heroImageUrl ? { heroImageUrl } : {}),
    },
  });

  // La config se lee en el layout raíz (metadata, tema, header, footer):
  // revalidar todo el árbol para que el cambio se vea en el sitio público.
  revalidatePath("/", "layout");

  return { ok: true };
}

export async function bulkImportAction(formData: FormData) {
  await requireAdmin();

  const csvText = formData.get("csv")?.toString();
  if (!csvText?.trim()) {
    return { error: "El archivo CSV está vacío." };
  }

  const lines = csvText.trim().split("\n");
  if (lines.length < 2) {
    return { error: "El CSV necesita una fila de encabezado y al menos un producto." };
  }

  // Parse header
  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
  const required = ["name", "category"];
  for (const col of required) {
    if (!headers.includes(col)) {
      return { error: `Falta la columna "${col}" en el CSV.` };
    }
  }

  // Get all categories for lookup
  const allCategories = await prisma.category.findMany();
  const categoryBySlug = new Map(allCategories.map((c) => [c.slug, c]));
  const categoryByName = new Map(allCategories.map((c) => [c.name.toLowerCase(), c]));

  const results: { created: number; errors: string[] } = { created: 0, errors: [] };

  for (let i = 1; i < lines.length; i++) {
    const cells = lines[i].split(",").map((c) => c.trim());
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => { row[h] = cells[idx] ?? ""; });

    const categoryName = row["category"]?.toLowerCase() ?? "";
    const category = categoryByName.get(categoryName) ?? categoryBySlug.get(row["category"] ?? "");
    if (!category) {
      results.errors.push(`Fila ${i + 1}: categoría "${row["category"]}" no encontrada`);
      continue;
    }

    try {
      const name = row["name"];
      if (!name || name.length < 2) {
        results.errors.push(`Fila ${i + 1}: nombre inválido`);
        continue;
      }

      await prisma.product.create({
        data: {
          name,
          slug: slugify(name),
          description: row["description"] || null,
          brand: row["brand"] || null,
          ageMin: row["age_min"] ? parseInt(row["age_min"], 10) : null,
          ageMax: row["age_max"] ? parseInt(row["age_max"], 10) : null,
          measure: row["measure"] || null,
          gauge: row["gauge"] || null,
          material: row["material"] || null,
          price: parseFloat(row["price"] || "0") || 0,
          stock: parseInt(row["stock"] || "0") || 0,
          available: true,
          categoryId: category.id,
        },
      });
      results.created++;
    } catch (err) {
      results.errors.push(`Fila ${i + 1}: ${err instanceof Error ? err.message : "error desconocido"}`);
    }
  }

  revalidateCatalog();
  return results;
}

export async function saveTestimonialAction(formData: FormData) {
  await requireAdmin();

  const parsed = testimonialSchema.safeParse({
    authorName: formData.get("authorName"),
    text: formData.get("text"),
    rating: formData.get("rating") || undefined,
    published: formData.get("published") === "on",
    sortOrder: formData.get("sortOrder") || 0,
  });

  if (!parsed.success) {
    redirect("/admin/testimonios?error=invalid");
  }

  const data = parsed.data;
  const testimonialId = formData.get("testimonialId")?.toString();

  // Foto del cliente (opcional): se sube a Storage si viene un archivo.
  let imageUrl: string | undefined;
  const image = formData.get("image");
  if (image instanceof File && image.size > 0 && image.type.startsWith("image/")) {
    try {
      imageUrl = await uploadBrandingAsset(
        Buffer.from(await image.arrayBuffer()),
        `testimonio-${slugify(data.authorName)}-${Date.now()}`,
        image.type,
      );
    } catch {
      redirect("/admin/testimonios?error=invalid");
    }
  }

  if (testimonialId) {
    await prisma.testimonial.update({
      where: { id: testimonialId },
      data: { ...data, ...(imageUrl ? { imageUrl } : {}) },
    });
  } else {
    await prisma.testimonial.create({ data: { ...data, imageUrl } });
  }

  revalidatePath("/");
  redirect("/admin/testimonios");
}

export async function deleteTestimonialAction(formData: FormData) {
  await requireAdmin();
  const testimonialId = formData.get("testimonialId")?.toString();
  if (!testimonialId) return;

  await prisma.testimonial.delete({ where: { id: testimonialId } });
  revalidatePath("/");
  redirect("/admin/testimonios");
}

export async function saveFaqAction(formData: FormData) {
  await requireAdmin();

  const parsed = faqItemSchema.safeParse({
    question: formData.get("question"),
    answer: formData.get("answer"),
    sortOrder: formData.get("sortOrder") || 0,
  });

  if (!parsed.success) {
    redirect("/admin/faq?error=invalid");
  }

  const faqId = formData.get("faqId")?.toString();
  if (faqId) {
    await prisma.faqItem.update({ where: { id: faqId }, data: parsed.data });
  } else {
    await prisma.faqItem.create({ data: parsed.data });
  }

  revalidatePath("/preguntas-frecuentes");
  redirect("/admin/faq");
}

export async function saveGeoQueryAction(formData: FormData) {
  await requireAdmin();

  const parsed = geoQuerySchema.safeParse({
    query: formData.get("query"),
    foundChatGpt: formData.get("foundChatGpt") === "on",
    foundGemini: formData.get("foundGemini") === "on",
    foundPerplexity: formData.get("foundPerplexity") === "on",
    foundCopilot: formData.get("foundCopilot") === "on",
    foundClaude: formData.get("foundClaude") === "on",
    notes: formData.get("notes") || undefined,
  });

  if (!parsed.success) {
    redirect("/admin/geo-queries?error=invalid");
  }

  const geoQueryId = formData.get("geoQueryId")?.toString();
  const data = { ...parsed.data, lastCheckedAt: new Date() };

  if (geoQueryId) {
    await prisma.geoQuery.update({ where: { id: geoQueryId }, data });
  } else {
    await prisma.geoQuery.create({ data });
  }

  redirect("/admin/geo-queries");
}

export async function deleteGeoQueryAction(formData: FormData) {
  await requireAdmin();
  const geoQueryId = formData.get("geoQueryId")?.toString();
  if (!geoQueryId) return;

  await prisma.geoQuery.delete({ where: { id: geoQueryId } });
  redirect("/admin/geo-queries");
}

export async function saveCampaignAction(formData: FormData) {
  await requireAdmin();

  const parsed = campaignSchema.safeParse({
    title: formData.get("title"),
    subtitle: formData.get("subtitle") || undefined,
    ctaLabel: formData.get("ctaLabel") || undefined,
    ctaUrl: formData.get("ctaUrl") || undefined,
    startsAt: formData.get("startsAt"),
    endsAt: formData.get("endsAt"),
    active: formData.get("active") === "on",
  });

  if (!parsed.success) {
    redirect("/admin/campanas?error=invalid");
  }

  const data = parsed.data;
  const campaignId = formData.get("campaignId")?.toString();

  // Imagen de campaña (opcional): se sube a Storage si viene un archivo.
  let imageUrl: string | undefined;
  const image = formData.get("image");
  if (image instanceof File && image.size > 0 && image.type.startsWith("image/")) {
    try {
      imageUrl = await uploadBrandingAsset(
        Buffer.from(await image.arrayBuffer()),
        `campana-${slugify(data.title)}-${Date.now()}`,
        image.type,
      );
    } catch {
      redirect("/admin/campanas?error=invalid");
    }
  }

  if (campaignId) {
    await prisma.campaign.update({
      where: { id: campaignId },
      data: { ...data, ...(imageUrl ? { imageUrl } : {}) },
    });
  } else {
    await prisma.campaign.create({ data: { ...data, imageUrl } });
  }

  revalidatePath("/");
  redirect("/admin/campanas");
}

export async function deleteCampaignAction(formData: FormData) {
  await requireAdmin();
  const campaignId = formData.get("campaignId")?.toString();
  if (!campaignId) return;

  await prisma.campaign.delete({ where: { id: campaignId } });
  revalidatePath("/");
  redirect("/admin/campanas");
}

export async function deleteFaqAction(formData: FormData) {
  await requireAdmin();
  const faqId = formData.get("faqId")?.toString();
  if (!faqId) return;

  await prisma.faqItem.delete({ where: { id: faqId } });
  revalidatePath("/preguntas-frecuentes");
  redirect("/admin/faq");
}
