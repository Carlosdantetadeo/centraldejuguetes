import { NextResponse } from "next/server";
import { createResetToken } from "@/lib/auth";
import { RESET_TOKEN_HOURS } from "@/lib/constants";
import { prisma } from "@/lib/db";
import { getSiteUrl } from "@/lib/utils";
import { forgotPasswordSchema } from "@/lib/validations";

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = forgotPasswordSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos." },
      { status: 400 },
    );
  }

  const email = parsed.data.email.toLowerCase();
  const admin = await prisma.admin.findUnique({ where: { email } });
  const genericMessage =
    "Si el correo está registrado, recibirás un enlace de recuperación en los próximos minutos.";

  if (!admin) {
    return NextResponse.json({ message: genericMessage });
  }

  const token = createResetToken();
  const expires = new Date(Date.now() + RESET_TOKEN_HOURS * 60 * 60 * 1000);

  await prisma.admin.update({
    where: { id: admin.id },
    data: {
      resetToken: token,
      resetTokenExpires: expires,
    },
  });

  const resetUrl = `${getSiteUrl()}/admin/restablecer-contrasena?token=${token}`;

  if (process.env.SMTP_HOST) {
    // Placeholder for SMTP integration when credentials are configured.
    console.log(`Password reset email for ${email}: ${resetUrl}`);
  } else {
    console.log(`[DEV] Password reset link for ${email}: ${resetUrl}`);
  }

  return NextResponse.json({
    message: genericMessage,
    ...(process.env.NODE_ENV === "development" ? { devResetUrl: resetUrl } : {}),
  });
}
