import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { processProductImage } from "@/lib/image-process";
import { imageAltSchema } from "@/lib/validations";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const formData = await request.formData();
  const productId = formData.get("productId")?.toString();
  const file = formData.get("file");
  const altParsed = imageAltSchema.safeParse({
    altText: formData.get("altText"),
  });

  if (!productId || !(file instanceof File)) {
    return NextResponse.json({ error: "Producto e imagen son obligatorios." }, { status: 400 });
  }

  if (!altParsed.success) {
    return NextResponse.json(
      { error: altParsed.error.issues[0]?.message ?? "Alt text inválido." },
      { status: 400 },
    );
  }

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) {
    return NextResponse.json({ error: "Producto no encontrado." }, { status: 404 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const filenameBase = `${product.slug}-${Date.now()}`;
  const processed = await processProductImage(buffer, filenameBase);
  const sortOrder = await prisma.productImage.count({ where: { productId } });

  await prisma.productImage.create({
    data: {
      productId,
      altText: altParsed.data.altText,
      sortOrder,
      ...processed,
    },
  });

  revalidatePath("/");
  const category = await prisma.category.findUnique({ where: { id: product.categoryId } });
  if (category) {
    revalidatePath(`/producto/${category.slug}/${product.slug}`);
  }

  return NextResponse.json({ ok: true });
}
