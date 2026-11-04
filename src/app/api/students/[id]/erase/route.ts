import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isResponse, jsonError, logError, requireUser } from "@/lib/http";
import { ADMIN_ROLES } from "@/lib/access";

type Context = { params: Promise<{ id: string }> };

/**
 * Right-to-erasure: removes every personal detail of a student but keeps the anonymous
 * academic and financial rows, so fee totals and class statistics stay correct.
 */
export async function POST(_request: NextRequest, { params }: Context) {
  const user = await requireUser(ADMIN_ROLES);
  if (isResponse(user)) return user;
  const { id } = await params;
  const student = await prisma.student.findFirst({ where: { id, schoolId: user.schoolId }, select: { id: true } });
  if (!student) return jsonError("Student not found.", 404);
  try {
    await prisma.$transaction([
      prisma.student.update({
        where: { id },
        data: {
          admissionNo: `ERASED-${id}`,
          firstName: "Erased",
          lastName: "Student",
          middleName: null,
          dateOfBirth: null,
          sex: null,
          stateOfOrigin: null,
          guardianName: null,
          guardianPhone: null,
          guardianEmail: null,
          address: null,
          status: "INACTIVE",
        },
      }),
      prisma.auditLog.create({ data: { schoolId: user.schoolId, userId: user.id, action: "STUDENT_DATA_ERASED", entity: "Student", entityId: id } }),
    ]);
    return NextResponse.json({ erased: true });
  } catch (error) {
    logError("students:erase", error);
    return jsonError("The student data could not be erased. Please try again.", 500);
  }
}
