import { prisma } from "@/lib/prisma";
import { isResponse, jsonError, requireUser } from "@/lib/http";
import { ADMIN_ROLES } from "@/lib/access";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

/** Lets a school administrator download everything the school has stored, as a JSON file. */
export async function GET() {
  const user = await requireUser(ADMIN_ROLES);
  if (isResponse(user)) return user;
  const limit = rateLimit(`export:${user.schoolId}`, 5, 60 * 60 * 1000);
  if (!limit.ok) return jsonError("You can export up to 5 times per hour. Please try again later.", 429, { "Retry-After": String(limit.retryAfter) });

  const where = { schoolId: user.schoolId };
  const [school, staff, classrooms, subjects, years, students, results, attendance, invoices, payments, assignments, auditLogs] = await Promise.all([
    prisma.school.findUnique({ where: { id: user.schoolId }, select: { name: true, email: true, phone: true, address: true, currency: true, timezone: true, createdAt: true } }),
    prisma.user.findMany({ where, select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true } }),
    prisma.classroom.findMany({ where }),
    prisma.subject.findMany({ where }),
    prisma.academicYear.findMany({ where, include: { terms: true } }),
    prisma.student.findMany({ where }),
    prisma.studentResult.findMany({ where }),
    prisma.attendanceSession.findMany({ where, include: { records: true } }),
    prisma.feeInvoice.findMany({ where }),
    prisma.payment.findMany({ where, select: { id: true, studentId: true, invoiceId: true, amount: true, currency: true, status: true, gatewayReference: true, paidAt: true, createdAt: true } }),
    prisma.teacherAssignment.findMany({ where }),
    prisma.auditLog.findMany({ where, orderBy: { createdAt: "desc" }, take: 2000 }),
  ]);

  await prisma.auditLog.create({ data: { schoolId: user.schoolId, userId: user.id, action: "DATA_EXPORTED", entity: "School", entityId: user.schoolId } });

  const body = JSON.stringify(
    { exportedAt: new Date().toISOString(), school, staff, classrooms, subjects, academicYears: years, students, results, attendance, invoices, payments, teacherAssignments: assignments, auditLog: auditLogs },
    null,
    2,
  );
  return new Response(body, {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="school4you-export-${new Date().toISOString().slice(0, 10)}.json"`,
      "Cache-Control": "no-store",
    },
  });
}
