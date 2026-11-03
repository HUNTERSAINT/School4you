import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, isResponse, jsonError } from "@/lib/http";
import { studentSchema } from "@/lib/validators";

export async function GET() {
  const user = await requireUser();
  if (isResponse(user)) return user;
  const students = await prisma.student.findMany({
    where: { schoolId: user.schoolId, status: "ACTIVE" },
    include: { classroom: { select: { id: true, name: true } }, feeInvoices: { include: { payments: { where: { status: "SUCCESSFUL" }, select: { amount: true } } } } },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  });
  return NextResponse.json({ students });
}

export async function POST(request: NextRequest) {
  const user = await requireUser(["SCHOOL_ADMIN", "SUPER_ADMIN"]);
  if (isResponse(user)) return user;
  const parsed = studentSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError("Please provide the required student details.");
  const data = parsed.data;
  const classroom = await prisma.classroom.findFirst({ where: { id: data.classroomId, schoolId: user.schoolId } });
  if (!classroom) return jsonError("Selected class was not found.", 404);
  try {
    const student = await prisma.student.create({ data: {
      schoolId: user.schoolId, classroomId: classroom.id, admissionNo: data.admissionNo,
      firstName: data.firstName, lastName: data.lastName, middleName: data.middleName || null,
      dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null, sex: data.sex || null,
      stateOfOrigin: data.stateOfOrigin || null, guardianName: data.guardianName || null,
      guardianPhone: data.guardianPhone || null, guardianEmail: data.guardianEmail || null,
    }, include: { classroom: true } });
    await prisma.auditLog.create({ data: { schoolId: user.schoolId, userId: user.id, action: "STUDENT_CREATED", entity: "Student", entityId: student.id } });
    return NextResponse.json({ student }, { status: 201 });
  } catch { return jsonError("A student with this admission number may already exist.", 409); }
}
