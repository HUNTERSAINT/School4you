import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, isResponse, jsonError, isUniqueViolation, logError } from "@/lib/http";
import { ACADEMIC_ROLES, ADMIN_ROLES, classScope } from "@/lib/access";
import { subjectSchema } from "@/lib/validators";

export async function GET(request: NextRequest) {
  const user = await requireUser(ACADEMIC_ROLES);
  if (isResponse(user)) return user;
  const classroomId = request.nextUrl.searchParams.get("classroomId") || undefined;
  const scope = await classScope(user);
  if (scope && classroomId && !scope.includes(classroomId)) return NextResponse.json({ subjects: [] });
  const subjects = await prisma.subject.findMany({
    where: { schoolId: user.schoolId, ...(classroomId ? { classroomId } : scope ? { classroomId: { in: scope } } : {}) },
    orderBy: { name: "asc" },
  });
  return NextResponse.json({ subjects });
}

export async function POST(request: NextRequest) {
  const user = await requireUser(ADMIN_ROLES);
  if (isResponse(user)) return user;
  const parsed = subjectSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError("Enter a subject, class and valid score limits.");
  const classroom = await prisma.classroom.findFirst({ where: { id: parsed.data.classroomId, schoolId: user.schoolId } });
  if (!classroom) return jsonError("Class not found.", 404);
  try {
    const subject = await prisma.subject.create({
      data: { schoolId: user.schoolId, classroomId: classroom.id, name: parsed.data.name, maxCaScore: parsed.data.maxCaScore, maxExamScore: parsed.data.maxExamScore },
    });
    await prisma.auditLog.create({ data: { schoolId: user.schoolId, userId: user.id, action: "SUBJECT_CREATED", entity: "Subject", entityId: subject.id } });
    return NextResponse.json({ subject }, { status: 201 });
  } catch (error) {
    if (isUniqueViolation(error)) return jsonError("That subject already exists in this class.", 409);
    logError("subjects:create", error);
    return jsonError("The subject could not be created. Please try again.", 500);
  }
}
