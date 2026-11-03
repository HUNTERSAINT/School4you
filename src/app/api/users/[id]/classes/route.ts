import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser, isResponse, jsonError } from "@/lib/http";
import { ADMIN_ROLES } from "@/lib/access";

type Context = { params: Promise<{ id: string }> };

/** Replaces the set of classes a teacher is allowed to enter attendance and results for. */
export async function PUT(request: NextRequest, { params }: Context) {
  const user = await requireUser(ADMIN_ROLES);
  if (isResponse(user)) return user;
  const { id } = await params;
  const parsed = z.object({ classroomIds: z.array(z.string().min(1)).max(200) }).safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError("Choose the classes this teacher handles.");

  const teacher = await prisma.user.findFirst({ where: { id, schoolId: user.schoolId, role: "TEACHER" }, select: { id: true } });
  if (!teacher) return jsonError("Teacher account not found.", 404);

  const classroomIds = [...new Set(parsed.data.classroomIds)];
  const valid = await prisma.classroom.findMany({ where: { id: { in: classroomIds }, schoolId: user.schoolId }, select: { id: true } });
  if (valid.length !== classroomIds.length) return jsonError("One or more classes were not found.", 404);

  await prisma.$transaction([
    prisma.teacherAssignment.deleteMany({ where: { userId: id, schoolId: user.schoolId } }),
    prisma.teacherAssignment.createMany({ data: classroomIds.map((classroomId) => ({ schoolId: user.schoolId, userId: id, classroomId })) }),
    prisma.auditLog.create({ data: { schoolId: user.schoolId, userId: user.id, action: "TEACHER_CLASSES_SET", entity: "User", entityId: id, metadata: { classroomIds } } }),
  ]);
  return NextResponse.json({ classroomIds });
}
