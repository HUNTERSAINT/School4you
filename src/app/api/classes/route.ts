import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser, isResponse, jsonError, isUniqueViolation, logError } from "@/lib/http";
import { ADMIN_ROLES, classScope } from "@/lib/access";

export async function GET() {
  const user = await requireUser();
  if (isResponse(user)) return user;
  const scope = await classScope(user);
  const classes = await prisma.classroom.findMany({
    where: { schoolId: user.schoolId, ...(scope ? { id: { in: scope } } : {}) },
    include: { _count: { select: { students: true } } },
    orderBy: { name: "asc" },
  });
  return NextResponse.json({ classes });
}

export async function POST(request: NextRequest) {
  const user = await requireUser(ADMIN_ROLES);
  if (isResponse(user)) return user;
  const parsed = z.object({ name: z.string().trim().min(2).max(60), level: z.string().trim().max(40).optional() }).safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError("Enter a valid class name.");
  try {
    const classroom = await prisma.classroom.create({ data: { schoolId: user.schoolId, name: parsed.data.name, level: parsed.data.level || null } });
    await prisma.auditLog.create({ data: { schoolId: user.schoolId, userId: user.id, action: "CLASS_CREATED", entity: "Classroom", entityId: classroom.id } });
    return NextResponse.json({ classroom }, { status: 201 });
  } catch (error) {
    if (isUniqueViolation(error)) return jsonError("That class already exists.", 409);
    logError("classes:create", error);
    return jsonError("The class could not be created. Please try again.", 500);
  }
}
