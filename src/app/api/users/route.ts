import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireUser, isResponse, jsonError, isUniqueViolation, logError } from "@/lib/http";
import { ADMIN_ROLES } from "@/lib/access";
import { staffSchema } from "@/lib/validators";

export const runtime = "nodejs";

export async function GET() {
  const user = await requireUser(ADMIN_ROLES);
  if (isResponse(user)) return user;
  const users = await prisma.user.findMany({
    where: { schoolId: user.schoolId },
    select: {
      id: true, name: true, email: true, role: true, isActive: true, createdAt: true,
      teacherAssignments: { select: { classroomId: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({
    users: users.map(({ teacherAssignments, ...rest }) => ({ ...rest, classroomIds: teacherAssignments.map((row) => row.classroomId) })),
  });
}

export async function POST(request: NextRequest) {
  const user = await requireUser(ADMIN_ROLES);
  if (isResponse(user)) return user;
  const parsed = staffSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Enter a name, valid email, password of at least 10 characters and staff role.");
  const exists = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (exists) return jsonError("An account with this email already exists.", 409);
  try {
    const staff = await prisma.user.create({
      data: { schoolId: user.schoolId, name: parsed.data.name, email: parsed.data.email, passwordHash: await hash(parsed.data.password, 12), role: parsed.data.role },
      select: { id: true, name: true, email: true, role: true, isActive: true },
    });
    await prisma.auditLog.create({ data: { schoolId: user.schoolId, userId: user.id, action: "STAFF_ACCOUNT_CREATED", entity: "User", entityId: staff.id } });
    return NextResponse.json({ user: { ...staff, classroomIds: [] } }, { status: 201 });
  } catch (error) {
    if (isUniqueViolation(error)) return jsonError("An account with this email already exists.", 409);
    logError("users:create", error);
    return jsonError("The staff account could not be created. Please try again.", 500);
  }
}
