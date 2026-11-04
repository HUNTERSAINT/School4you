import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { jsonError, logError } from "@/lib/http";
import { passwordSchema } from "@/lib/validators";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { consumeToken } from "@/lib/tokens";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const limit = rateLimit(`reset:ip:${clientIp(request.headers)}`, 20, 60 * 60 * 1000);
  if (!limit.ok) return jsonError("Too many attempts. Please try again later.", 429, { "Retry-After": String(limit.retryAfter) });

  const parsed = z.object({ token: z.string().min(1).max(200), password: passwordSchema }).safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Enter a new password of 10 to 72 characters.");

  try {
    const userId = await consumeToken(parsed.data.token, "RESET_PASSWORD");
    if (!userId) return jsonError("This reset link is invalid or has expired. Please request a new one.", 400);
    const user = await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: await hash(parsed.data.password, 12), sessionVersion: { increment: 1 }, emailVerifiedAt: new Date() },
      select: { schoolId: true },
    });
    if (user.schoolId) await prisma.auditLog.create({ data: { schoolId: user.schoolId, userId, action: "PASSWORD_RESET_BY_EMAIL", entity: "User", entityId: userId } });
    return NextResponse.json({ reset: true });
  } catch (error) {
    logError("reset-password", error);
    return jsonError("Your password could not be reset right now. Please try again.", 500);
  }
}
