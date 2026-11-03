import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser, isResponse, jsonError } from "@/lib/http";
import { ADMIN_ROLES } from "@/lib/access";
import { passwordSchema } from "@/lib/validators";

export const runtime = "nodejs";

type Context = { params: Promise<{ id: string }> };

/** An administrator sets a new temporary password for a teacher or bursar who is locked out. */
export async function POST(request: NextRequest, { params }: Context) {
  const user = await requireUser(ADMIN_ROLES);
  if (isResponse(user)) return user;
  const { id } = await params;
  if (id === user.id) return jsonError("Use your account page to change your own password.");
  const parsed = z.object({ password: passwordSchema }).safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Enter a temporary password of at least 10 characters.");

  const target = await prisma.user.findFirst({ where: { id, schoolId: user.schoolId, role: { in: ["TEACHER", "BURSAR"] } }, select: { id: true } });
  if (!target) return jsonError("Staff account not found.", 404);

  await prisma.user.update({ where: { id }, data: { passwordHash: await hash(parsed.data.password, 12), sessionVersion: { increment: 1 } } });
  await prisma.auditLog.create({ data: { schoolId: user.schoolId, userId: user.id, action: "STAFF_PASSWORD_RESET", entity: "User", entityId: id } });
  return NextResponse.json({ reset: true });
}
