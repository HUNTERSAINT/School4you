import { NextRequest, NextResponse } from "next/server";
import { compare, hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/auth";
import { isResponse, jsonError, requireUser } from "@/lib/http";
import { changePasswordSchema } from "@/lib/validators";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const user = await requireUser();
  if (isResponse(user)) return user;

  const limit = rateLimit(`change-password:${user.id}`, 5, 15 * 60 * 1000);
  if (!limit.ok) return jsonError("Too many attempts. Please wait a few minutes.", 429, { "Retry-After": String(limit.retryAfter) });

  const parsed = changePasswordSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Enter your current password and a new password of at least 10 characters.");
  const { currentPassword, newPassword } = parsed.data;
  if (currentPassword === newPassword) return jsonError("Choose a new password that is different from the current one.");

  const record = await prisma.user.findUnique({ where: { id: user.id }, select: { passwordHash: true } });
  if (!record || !(await compare(currentPassword, record.passwordHash))) return jsonError("Your current password is incorrect.", 403);

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await hash(newPassword, 12), sessionVersion: { increment: 1 } },
    select: { sessionVersion: true },
  });
  await prisma.auditLog.create({ data: { schoolId: user.schoolId, userId: user.id, action: "PASSWORD_CHANGED", entity: "User", entityId: user.id } });
  // Every other device is signed out by the version bump; keep this one signed in.
  await createSession(user, updated.sessionVersion);
  return NextResponse.json({ changed: true });
}
