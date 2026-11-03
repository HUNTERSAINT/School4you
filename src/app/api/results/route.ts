import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, isResponse, jsonError } from "@/lib/http";
import { resultSchema } from "@/lib/validators";
import { calculateResult, DEFAULT_GRADE_BANDS } from "@/lib/grades";

export async function GET(request: NextRequest) {
  const user = await requireUser();
  if (isResponse(user)) return user;
  const studentId = request.nextUrl.searchParams.get("studentId");
  const termId = request.nextUrl.searchParams.get("termId");
  const results = await prisma.studentResult.findMany({
    where: { schoolId: user.schoolId, ...(studentId ? { studentId } : {}), ...(termId ? { termId } : {}) },
    include: { student: { select: { id: true, admissionNo: true, firstName: true, lastName: true, classroomId: true, classroom: { select: { name: true } } } }, subject: true, term: true },
    orderBy: [{ student: { lastName: "asc" } }, { subject: { name: "asc" } }],
  });
  return NextResponse.json({ results });
}
export async function POST(request: NextRequest) {
  const user = await requireUser(["SCHOOL_ADMIN", "TEACHER", "SUPER_ADMIN"]);
  if (isResponse(user)) return user;
  const parsed = resultSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError("Enter valid CA and examination scores.");
  const data = parsed.data;
  const [student, subject, term] = await Promise.all([
    prisma.student.findFirst({ where: { id: data.studentId, schoolId: user.schoolId } }),
    prisma.subject.findFirst({ where: { id: data.subjectId, schoolId: user.schoolId } }),
    prisma.term.findFirst({ where: { id: data.termId, schoolId: user.schoolId } }),
  ]);
  if (!student || !subject || !term || subject.classroomId !== student.classroomId) return jsonError("Student, subject or term is invalid for this school.", 404);
  let calculated;
  try { calculated = calculateResult(data.caScore, data.examScore, Number(subject.maxCaScore), Number(subject.maxExamScore), DEFAULT_GRADE_BANDS); }
  catch (error) { return jsonError(error instanceof Error ? error.message : "Invalid scores."); }
  const result = await prisma.studentResult.upsert({
    where: { studentId_subjectId_termId: { studentId: student.id, subjectId: subject.id, termId: term.id } },
    create: { schoolId: user.schoolId, studentId: student.id, subjectId: subject.id, termId: term.id, caScore: calculated.caScore, examScore: calculated.examScore, totalScore: calculated.total, grade: calculated.grade, remark: calculated.remark, enteredById: user.id },
    update: { caScore: calculated.caScore, examScore: calculated.examScore, totalScore: calculated.total, grade: calculated.grade, remark: calculated.remark, enteredById: user.id, status: "DRAFT" },
  });
  await prisma.auditLog.create({ data: { schoolId: user.schoolId, userId: user.id, action: "RESULT_SAVED", entity: "StudentResult", entityId: result.id } });
  return NextResponse.json({ result });
}
