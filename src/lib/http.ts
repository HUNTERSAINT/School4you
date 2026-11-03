import { NextResponse } from "next/server";
import { getSession, type SessionUser } from "@/lib/auth";

export function jsonError(message: string, status = 400, headers?: Record<string, string>) {
  return NextResponse.json({ error: message }, { status, headers });
}

export async function requireUser(roles?: readonly string[]): Promise<SessionUser | NextResponse> {
  const user = await getSession();
  if (!user) return jsonError("Authentication required.", 401);
  if (roles && !roles.includes(user.role)) return jsonError("You do not have permission to perform this action.", 403);
  return user;
}

export function isResponse(value: SessionUser | NextResponse): value is NextResponse {
  return value instanceof NextResponse;
}

/** True for Prisma's unique-constraint violation (P2002), without importing Prisma runtime. */
export function isUniqueViolation(error: unknown): boolean {
  return typeof error === "object" && error !== null && (error as { code?: unknown }).code === "P2002";
}

export function logError(scope: string, error: unknown) {
  console.error(`[${scope}]`, error);
}
