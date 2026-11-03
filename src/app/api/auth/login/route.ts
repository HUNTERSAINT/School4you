import { NextRequest, NextResponse } from "next/server";
import { compare } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/auth";
import { jsonError } from "@/lib/http";
import { loginSchema } from "@/lib/validators";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const parsed = loginSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError("Enter a valid email and password.");
  const user = await prisma.user.findUnique({ where: { email: parsed.data.email.toLowerCase() } });
  if (!user || !user.isActive || !user.schoolId || !(await compare(parsed.data.password, user.passwordHash))) return jsonError("Email or password is incorrect.", 401);
  await createSession({ id: user.id, email: user.email, name: user.name, role: user.role, schoolId: user.schoolId });
  return NextResponse.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role } });
}
