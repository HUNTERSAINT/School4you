import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

const COOKIE_NAME = "school4you_session";
const secret = () => {
  const value = process.env.AUTH_SECRET;
  if (!value || value.length < 32) throw new Error("AUTH_SECRET must be set to at least 32 characters.");
  return new TextEncoder().encode(value);
};

export type SessionUser = { id: string; email: string; name: string; role: string; schoolId: string };

export async function createSession(user: SessionUser) {
  const token = await new SignJWT(user).setProtectedHeader({ alg: "HS256" })
    .setIssuedAt().setExpirationTime("12h").sign(secret());
  const store = await cookies();
  store.set(COOKIE_NAME, token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 60 * 60 * 12 });
}

export async function getSession(request?: NextRequest): Promise<SessionUser | null> {
  const token = request ? request.cookies.get(COOKIE_NAME)?.value : (await cookies()).get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    if (!payload.id || !payload.schoolId || !payload.email || !payload.role || !payload.name) return null;
    const user = await prisma.user.findUnique({ where: { id: String(payload.id) }, select: { id: true, email: true, name: true, role: true, schoolId: true, isActive: true } });
    if (!user?.isActive || !user.schoolId) return null;
    return { id: user.id, email: user.email, name: user.name, role: user.role, schoolId: user.schoolId };
  } catch { return null; }
}

export async function destroySession() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}
