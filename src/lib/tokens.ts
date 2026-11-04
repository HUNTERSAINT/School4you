import type { TokenType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { hashToken, isTokenFormat, newRawToken } from "@/lib/token-utils";

export const HOUR_MS = 60 * 60 * 1000;

/** Creates a fresh token for the user and invalidates any unused older one of the same type. */
export async function createToken(userId: string, type: TokenType, ttlMs: number) {
  await prisma.authToken.deleteMany({ where: { userId, type, usedAt: null } });
  const raw = newRawToken();
  await prisma.authToken.create({ data: { userId, type, tokenHash: hashToken(raw), expiresAt: new Date(Date.now() + ttlMs) } });
  return raw;
}

/** Returns the owning user id exactly once, or null when the token is unknown, expired or already used. */
export async function consumeToken(raw: unknown, type: TokenType): Promise<string | null> {
  if (!isTokenFormat(raw)) return null;
  const row = await prisma.authToken.findUnique({ where: { tokenHash: hashToken(raw) } });
  if (!row || row.type !== type || row.usedAt || row.expiresAt < new Date()) return null;
  const claimed = await prisma.authToken.updateMany({ where: { id: row.id, usedAt: null }, data: { usedAt: new Date() } });
  return claimed.count === 1 ? row.userId : null;
}
