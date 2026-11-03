import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireUser, isResponse, jsonError, isUniqueViolation, logError } from "@/lib/http";
import { ADMIN_ROLES, classScope, isAdmin } from "@/lib/access";
import { studentSchema } from "@/lib/validators";
import { dateOnlyToUtc } from "@/lib/dates";

const baseSelect = {
  id: true, admissionNo: true, firstName: true, lastName: true, sex: true, status: true, classroomId: true,
  classroom: { select: { id: true, name: true } },
} satisfies Prisma.StudentSelect;
const contactSelect = { guardianName: true, guardianPhone: true, guardianEmail: true } satisfies Prisma.StudentSelect;
const fullSelect = { ...contactSelect, middleName: true, dateOfBirth: true, stateOfOrigin: true, address: true } satisfies Prisma.StudentSelect;

export async function GET(request: NextRequest) {
  const user = await requireUser();
  if (isResponse(user)) return user;

  // Least privilege: admins see full profiles, bursars see guardian contacts, teachers see only what they need.
  const select: Prisma.StudentSelect = isAdmin(user)
    ? { ...baseSelect, ...fullSelect }
    : user.role === "BURSAR"
      ? { ...baseSelect, ...contactSelect }
      : baseSelect;

  const params = request.nextUrl.searchParams;
  const classroomId = params.get("classroomId") || undefined;
  const query = params.get("q")?.trim();
  const limit = Math.min(Math.max(Number(params.get("limit")) || 2000, 1), 5000);

  const scope = await classScope(user);
  if (scope && classroomId && !scope.includes(classroomId)) return NextResponse.json({ students: [], total: 0 });

  const where: Prisma.StudentWhereInput = {
    schoolId: user.schoolId,
    status: "ACTIVE",
    ...(classroomId ? { classroomId } : scope ? { classroomId: { in: scope } } : {}),
    ...(query
      ? {
          OR: [
            { firstName: { contains: query, mode: "insensitive" } },
            { lastName: { contains: query, mode: "insensitive" } },
            { admissionNo: { contains: query, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [students, total] = await Promise.all([
    prisma.student.findMany({ where, select, orderBy: [{ lastName: "asc" }, { firstName: "asc" }], take: limit }),
    prisma.student.count({ where }),
  ]);
  return NextResponse.json({ students, total });
}

export async function POST(request: NextRequest) {
  const user = await requireUser(ADMIN_ROLES);
  if (isResponse(user)) return user;
  const parsed = studentSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Please provide the required student details.");
  const data = parsed.data;
  const classroom = await prisma.classroom.findFirst({ where: { id: data.classroomId, schoolId: user.schoolId } });
  if (!classroom) return jsonError("Selected class was not found.", 404);
  try {
    const student = await prisma.student.create({
      data: {
        schoolId: user.schoolId,
        classroomId: classroom.id,
        admissionNo: data.admissionNo,
        firstName: data.firstName,
        lastName: data.lastName,
        middleName: data.middleName || null,
        dateOfBirth: data.dateOfBirth ? dateOnlyToUtc(data.dateOfBirth) : null,
        sex: data.sex || null,
        stateOfOrigin: data.stateOfOrigin || null,
        guardianName: data.guardianName || null,
        guardianPhone: data.guardianPhone || null,
        guardianEmail: data.guardianEmail || null,
      },
      include: { classroom: true },
    });
    await prisma.auditLog.create({ data: { schoolId: user.schoolId, userId: user.id, action: "STUDENT_CREATED", entity: "Student", entityId: student.id } });
    return NextResponse.json({ student }, { status: 201 });
  } catch (error) {
    if (isUniqueViolation(error)) return jsonError("A student with this admission number already exists.", 409);
    logError("students:create", error);
    return jsonError("The student could not be saved. Please try again.", 500);
  }
}
