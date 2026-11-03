import { NextRequest, NextResponse } from "next/server";
import { compare, hashSync } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/auth";
import { jsonError } from "@/lib/http";
import { loginSchema } from "@/lib/validators";
import { clearRateLimit, clientIp, rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

const WINDOW_MS = 15 * 60 * 1000;
let dummyHash: string | undefined;
// Compared when the account does not exist so response time does not reveal which emails are registered.
const getDummyHash = () => (dummyHash ??= hashSync("school4you-not-a-real-password", 12));

export async function POST(request: NextRequest) {
  const parsed = loginSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError("Enter a valid email and password.");
  const { email, password } = parsed.data;

  const accountKey = `login:account:${email}`;
  const byIp = rateLimit(`login:ip:${clientIp(request.headers)}`, 30, WINDOW_MS);
  const byAccount = rateLimit(accountKey, 8, WINDOW_MS);
  if (!byIp.ok || !byAccount.ok) {
    const retryAfter = Math.max(byIp.retryAfter, byAccount.retryAfter);
    return jsonError("Too many sign-in attempts. Please wait a few minutes and try again.", 429, { "Retry-After": String(retryAfter) });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  const passwordMatches = await compare(password, user?.passwordHash ?? getDummyHash());
  if (!user || !passwordMatches || !user.isActive || !user.schoolId) return jsonError("Email or password is incorrect.", 401);

  clearRateLimit(accountKey);
  await createSession({ id: user.id, email: user.email, name: user.name, role: user.role, schoolId: user.schoolId }, user.sessionVersion);
  return NextResponse.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role } });
}
