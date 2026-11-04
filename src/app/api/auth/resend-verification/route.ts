import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isResponse, jsonError, requireUser } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";
import { sendVerificationEmail } from "@/lib/account-emails";

export const runtime = "nodejs";

export async function POST() {
  const user = await requireUser();
  if (isResponse(user)) return user;
  const limit = rateLimit(`resend-verify:${user.id}`, 3, 60 * 60 * 1000);
  if (!limit.ok) return jsonError("Please wait before requesting another email.", 429, { "Retry-After": String(limit.retryAfter) });
  const record = await prisma.user.findUnique({ where: { id: user.id }, select: { emailVerifiedAt: true } });
  if (record?.emailVerifiedAt) return NextResponse.json({ alreadyVerified: true });
  const result = await sendVerificationEmail(user.id, user.email, user.name);
  if (!result.sent) return jsonError("Email sending is not set up yet. Please contact the School4you administrator.", 503);
  return NextResponse.json({ sent: true });
}
