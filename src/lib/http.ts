import { NextResponse } from "next/server";
import { getSession, type SessionUser } from "@/lib/auth";

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function requireUser(roles?: string[]): Promise<SessionUser | NextResponse> {
  const user = await getSession();
  if (!user) return jsonError("Authentication required.", 401);
  if (roles && !roles.includes(user.role)) return jsonError("You do not have permission to perform this action.", 403);
  return user;
}

export function isResponse(value: SessionUser | NextResponse): value is NextResponse {
  return value instanceof NextResponse;
}
