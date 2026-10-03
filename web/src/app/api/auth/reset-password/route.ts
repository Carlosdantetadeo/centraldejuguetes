import { NextResponse } from "next/server";
import { hashPassword } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { resetPasswordSchema } from "@/lib/validations";

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = resetPasswordSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos." },
      { status: 400 },
    );
  }

  const admin = await prisma.admin.findFirst({
    where: {
      resetToken: parsed.data.token,
      resetTokenExpires: { gt: new Date() },
    },
  });

  if (!admin) {
    return NextResponse.json({ error: "El enlace expiró o no es válido." }, { status: 400 });
  }

  await prisma.admin.update({
    where: { id: admin.id },
    data: {
      passwordHash: await hashPassword(parsed.data.password),
      resetToken: null,
      resetTokenExpires: null,
    },
  });

  return NextResponse.json({ ok: true });
}
