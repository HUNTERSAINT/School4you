import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, isResponse, jsonError, logError } from "@/lib/http";
import { ADMIN_ROLES } from "@/lib/access";
import { studentUpdateSchema } from "@/lib/validators";
import { dateOnlyToUtc } from "@/lib/dates";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Context) {
  const user = await requireUser(ADMIN_ROLES);
  if (isResponse(user)) return user;
  const { id } = await params;
  const parsed = studentUpdateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Invalid student details.");
  const existing = await prisma.student.findFirst({ where: { id, schoolId: user.schoolId } });
  if (!existing) return jsonError("Student not found.", 404);
  const data = parsed.data;
  if (data.classroomId) {
    const classroom = await prisma.classroom.findFirst({ where: { id: data.classroomId, schoolId: user.schoolId } });
    if (!classroom) return jsonError("Class not found.", 404);
  }
  try {
    const student = await prisma.student.update({
      where: { id },
      data: { ...data, dateOfBirth: data.dateOfBirth === undefined ? undefined : data.dateOfBirth ? dateOnlyToUtc(data.dateOfBirth) : null },
    });
    await prisma.auditLog.create({ data: { schoolId: user.schoolId, userId: user.id, action: "STUDENT_UPDATED", entity: "Student", entityId: id } });
    return NextResponse.json({ student });
  } catch (error) {
    logError("students:update", error);
    return jsonError("The student could not be updated. Please try again.", 500);
  }
}

export async function DELETE(_request: NextRequest, { params }: Context) {
  const user = await requireUser(ADMIN_ROLES);
  if (isResponse(user)) return user;
  const { id } = await params;
  const existing = await prisma.student.findFirst({ where: { id, schoolId: user.schoolId } });
  if (!existing) return jsonError("Student not found.", 404);
  await prisma.student.update({ where: { id }, data: { status: "INACTIVE" } });
  await prisma.auditLog.create({ data: { schoolId: user.schoolId, userId: user.id, action: "STUDENT_ARCHIVED", entity: "Student", entityId: id } });
  return NextResponse.json({ archived: true });
}
