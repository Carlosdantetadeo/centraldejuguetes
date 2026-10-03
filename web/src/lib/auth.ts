import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, SESSION_MAX_AGE_DAYS } from "@/lib/constants";
import { prisma } from "@/lib/db";

const SESSION_MAX_AGE_SECONDS = SESSION_MAX_AGE_DAYS * 24 * 60 * 60;

function getAuthSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("AUTH_SECRET must be at least 32 characters.");
  }
  return new TextEncoder().encode(secret);
}

export type SessionPayload = {
  sub: string;
  email: string;
};

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(
  password: string,
  passwordHash: string,
): Promise<boolean> {
  return bcrypt.compare(password, passwordHash);
}

export async function createSession(adminId: string, email: string): Promise<void> {
  const token = await new SignJWT({ email })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(adminId)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_DAYS}d`)
    .sign(getAuthSecret());

  await prisma.admin.update({
    where: { id: adminId },
    data: { lastActiveAt: new Date() },
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function getSession(): Promise<(SessionPayload & { adminId: string }) | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getAuthSecret());
    const adminId = payload.sub;
    const email = payload.email;

    if (!adminId || typeof email !== "string") return null;

    const admin = await prisma.admin.findUnique({ where: { id: adminId } });
    if (!admin) return null;

    const inactiveMs = Date.now() - admin.lastActiveAt.getTime();
    const maxInactiveMs = SESSION_MAX_AGE_DAYS * 24 * 60 * 60 * 1000;
    if (inactiveMs > maxInactiveMs) return null;

    return { adminId, sub: adminId, email };
  } catch {
    return null;
  }
}

export async function requireAdmin(): Promise<SessionPayload & { adminId: string }> {
  const session = await getSession();
  if (!session) {
    redirect("/admin/login");
  }
  return session;
}

export async function touchSession(adminId: string): Promise<void> {
  await prisma.admin.update({
    where: { id: adminId },
    data: { lastActiveAt: new Date() },
  });
}

export function createResetToken(): string {
  return crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "");
}
