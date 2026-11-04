import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { jsonError, logError } from "@/lib/http";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { consumeToken } from "@/lib/tokens";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const limit = rateLimit(`verify:ip:${clientIp(request.headers)}`, 30, 60 * 60 * 1000);
  if (!limit.ok) return jsonError("Too many attempts. Please try again later.", 429, { "Retry-After": String(limit.retryAfter) });
  const parsed = z.object({ token: z.string().min(1).max(200) }).safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError("This verification link is not valid.");
  try {
    const userId = await consumeToken(parsed.data.token, "VERIFY_EMAIL");
    if (!userId) return jsonError("This verification link is invalid or has expired. Sign in and request a new one.", 400);
    await prisma.user.update({ where: { id: userId }, data: { emailVerifiedAt: new Date() } });
    return NextResponse.json({ verified: true });
  } catch (error) {
    logError("verify-email", error);
    return jsonError("We could not verify your email right now. Please try again.", 500);
  }
}
