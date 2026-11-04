import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { jsonError, logError } from "@/lib/http";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { sendPasswordResetEmail } from "@/lib/account-emails";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const parsed = z.object({ email: z.string().trim().toLowerCase().email().max(254) }).safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError("Enter a valid email address.");
  const { email } = parsed.data;

  const byIp = rateLimit(`forgot:ip:${clientIp(request.headers)}`, 10, 60 * 60 * 1000);
  const byEmail = rateLimit(`forgot:email:${email}`, 3, 60 * 60 * 1000);
  if (!byIp.ok || !byEmail.ok) return jsonError("Too many requests. Please try again later.", 429, { "Retry-After": String(Math.max(byIp.retryAfter, byEmail.retryAfter)) });

  try {
    const user = await prisma.user.findUnique({ where: { email }, select: { id: true, name: true, email: true, isActive: true } });
    // Sent in the background and always answered the same way, so the form never reveals which emails are registered.
    if (user?.isActive) void sendPasswordResetEmail(user.id, user.email, user.name);
  } catch (error) {
    logError("forgot-password", error);
  }
  return NextResponse.json({ ok: true });
}
