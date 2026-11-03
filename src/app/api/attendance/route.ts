import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, isResponse, jsonError, logError } from "@/lib/http";
import { ACADEMIC_ROLES, canAccessClass, classScope } from "@/lib/access";
import { attendanceQuerySchema, attendanceSchema } from "@/lib/validators";
import { dateOnlyToUtc } from "@/lib/dates";

export async function GET(request: NextRequest) {
  const user = await requireUser(ACADEMIC_ROLES);
  if (isResponse(user)) return user;
  const params = request.nextUrl.searchParams;
  const parsed = attendanceQuerySchema.safeParse({ date: params.get("date") || undefined, classroomId: params.get("classroomId") || undefined });
  if (!parsed.success) return jsonError("Enter a valid date.");
  const { date, classroomId } = parsed.data;

  const scope = await classScope(user);
  if (scope && classroomId && !scope.includes(classroomId)) return NextResponse.json({ sessions: [] });

  const sessions = await prisma.attendanceSession.findMany({
    where: {
      schoolId: user.schoolId,
      ...(date ? { date: dateOnlyToUtc(date) } : {}),
      ...(classroomId ? { classroomId } : scope ? { classroomId: { in: scope } } : {}),
    },
    include: { records: { include: { student: { select: { id: true, firstName: true, lastName: true, admissionNo: true } } } } },
    orderBy: { date: "desc" },
    take: 100,
  });
  return NextResponse.json({ sessions });
}

export async function POST(request: NextRequest) {
  const user = await requireUser(ACADEMIC_ROLES);
  if (isResponse(user)) return user;
  const parsed = attendanceSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError("Select a class, date and attendance status for each student.");
  const { classroomId, date } = parsed.data;

  const classroom = await prisma.classroom.findFirst({ where: { id: classroomId, schoolId: user.schoolId }, select: { id: true } });
  if (!classroom) return jsonError("Class not found.", 404);
  if (!(await canAccessClass(user, classroomId))) return jsonError("You are not assigned to this class.", 403);

  // One status per student: if a student appears twice the last entry wins.
  type Status = "PRESENT" | "ABSENT" | "LATE" | "EXCUSED";
  const byStudent = new Map<string, Status>(parsed.data.records.map((record): [string, Status] => [record.studentId, record.status]));
  const records = [...byStudent].map(([studentId, status]) => ({ studentId, status }));
  const valid = await prisma.student.findMany({ where: { id: { in: [...byStudent.keys()] }, schoolId: user.schoolId, classroomId }, select: { id: true } });
  if (valid.length !== records.length) return jsonError("Attendance includes a student outside this class.", 400);

  const sessionDate = dateOnlyToUtc(date);
  try {
    const session = await prisma.attendanceSession.upsert({
      where: { classroomId_date: { classroomId, date: sessionDate } },
      create: { schoolId: user.schoolId, classroomId, date: sessionDate, markedById: user.id, records: { create: records } },
      update: { markedById: user.id, records: { deleteMany: {}, create: records } },
      include: { records: true },
    });
    await prisma.auditLog.create({ data: { schoolId: user.schoolId, userId: user.id, action: "ATTENDANCE_SAVED", entity: "AttendanceSession", entityId: session.id } });
    return NextResponse.json({ session });
  } catch (error) {
    logError("attendance:save", error);
    return jsonError("Attendance could not be saved. Please try again.", 500);
  }
}
