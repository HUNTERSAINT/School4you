import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser, isResponse, jsonError } from "@/lib/http";

export async function GET() {
  const user = await requireUser();
  if (isResponse(user)) return user;
  const classes = await prisma.classroom.findMany({ where: { schoolId: user.schoolId }, include: { _count: { select: { students: true } } }, orderBy: { name: "asc" } });
  return NextResponse.json({ classes });
}
export async function POST(request: NextRequest) {
  const user = await requireUser(["SCHOOL_ADMIN", "SUPER_ADMIN"]);
  if (isResponse(user)) return user;
  const parsed = z.object({ name: z.string().trim().min(2).max(60), level: z.string().trim().max(40).optional() }).safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError("Enter a valid class name.");
  try {
    const classroom = await prisma.classroom.create({ data: { schoolId: user.schoolId, name: parsed.data.name, level: parsed.data.level || null } });
    return NextResponse.json({ classroom }, { status: 201 });
  } catch { return jsonError("That class already exists.", 409); }
}
