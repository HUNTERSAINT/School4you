import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, isResponse, jsonError } from "@/lib/http";
import { attendanceSchema } from "@/lib/validators";

export async function GET(request: NextRequest) {
  const user = await requireUser();
  if (isResponse(user)) return user;
  const date = request.nextUrl.searchParams.get("date");
  const classroomId = request.nextUrl.searchParams.get("classroomId");
  const sessions = await prisma.attendanceSession.findMany({
    where: { schoolId: user.schoolId, ...(date ? { date: new Date(date + "T00:00:00.000Z") } : {}), ...(classroomId ? { classroomId } : {}) },
    include: { records: { include: { student: { select: { id: true, firstName: true, lastName: true, admissionNo: true } } } } },
    orderBy: { date: "desc" }, take: 100,
  });
  return NextResponse.json({ sessions });
}

export async function POST(request: NextRequest) {
  const user = await requireUser(["SCHOOL_ADMIN", "TEACHER", "SUPER_ADMIN"]);
  if (isResponse(user)) return user;
  const parsed = attendanceSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError("Select a class, date and attendance status for each student.");
  const { classroomId, date, records } = parsed.data;
  const classroom = await prisma.classroom.findFirst({ where: { id: classroomId, schoolId: user.schoolId }, select: { id: true } });
  if (!classroom) return jsonError("Class not found.", 404);
  const ids = [...new Set(records.map(r => r.studentId))];
  const valid = await prisma.student.findMany({ where: { id: { in: ids }, schoolId: user.schoolId, classroomId }, select: { id: true } });
  if (valid.length !== ids.length) return jsonError("Attendance includes a student outside this class.", 400);
  const session = await prisma.attendanceSession.upsert({
    where: { classroomId_date: { classroomId, date: new Date(date + "T00:00:00.000Z") } },
    create: { schoolId: user.schoolId, classroomId, date: new Date(date + "T00:00:00.000Z"), markedById: user.id, records: { create: records } },
    update: { markedById: user.id, records: { deleteMany: {}, create: records } },
    include: { records: true },
  });
  await prisma.auditLog.create({ data: { schoolId: user.schoolId, userId: user.id, action: "ATTENDANCE_SAVED", entity: "AttendanceSession", entityId: session.id } });
  return NextResponse.json({ session });
}
