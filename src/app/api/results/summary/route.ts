import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, isResponse, jsonError } from "@/lib/http";
import { ACADEMIC_ROLES, canAccessClass } from "@/lib/access";
import { calculateClassAverage, calculatePosition, gradeForPercentage, round2 } from "@/lib/grades";

export async function GET(request: NextRequest) {
  const user = await requireUser(ACADEMIC_ROLES);
  if (isResponse(user)) return user;
  const studentId = request.nextUrl.searchParams.get("studentId");
  const termId = request.nextUrl.searchParams.get("termId");
  if (!studentId || !termId) return jsonError("Student and term are required.");

  const [student, term, school] = await Promise.all([
    prisma.student.findFirst({ where: { id: studentId, schoolId: user.schoolId }, include: { classroom: true } }),
    prisma.term.findFirst({ where: { id: termId, schoolId: user.schoolId }, include: { academicYear: true } }),
    prisma.school.findUnique({ where: { id: user.schoolId }, select: { name: true, address: true, phone: true } }),
  ]);
  if (!student) return jsonError("Student not found.", 404);
  if (!term) return jsonError("Term not found.", 404);
  if (!(await canAccessClass(user, student.classroomId))) return jsonError("You are not assigned to this student's class.", 403);

  const [rows, roster, subjectsOffered] = await Promise.all([
    prisma.studentResult.findMany({
      where: { schoolId: user.schoolId, termId, student: { classroomId: student.classroomId } },
      include: { subject: true },
    }),
    prisma.student.findMany({ where: { schoolId: user.schoolId, classroomId: student.classroomId, status: "ACTIVE" }, select: { id: true } }),
    prisma.subject.count({ where: { schoolId: user.schoolId, classroomId: student.classroomId } }),
  ]);

  // Rank by average PERCENTAGE so subjects with different maximum marks count fairly,
  // and only students who actually have results in this term are ranked.
  const activeIds = new Set(roster.map((item) => item.id));
  const perStudent = new Map<string, { percentSum: number; subjects: number }>();
  for (const row of rows) {
    const max = Number(row.subject.maxCaScore) + Number(row.subject.maxExamScore);
    const percentage = max > 0 ? (Number(row.totalScore) / max) * 100 : 0;
    const current = perStudent.get(row.studentId) ?? { percentSum: 0, subjects: 0 };
    current.percentSum += percentage;
    current.subjects += 1;
    perStudent.set(row.studentId, current);
  }
  const averageOf = (id: string) => {
    const entry = perStudent.get(id);
    return entry && entry.subjects ? entry.percentSum / entry.subjects : 0;
  };
  const rankedIds = [...perStudent.keys()].filter((id) => activeIds.has(id) || id === studentId);
  const rankedAverages = rankedIds.map(averageOf);

  const own = perStudent.get(studentId);
  const subjectsEntered = own?.subjects ?? 0;
  const ownAverage = averageOf(studentId);
  const overall = gradeForPercentage(ownAverage);

  const ownRows = rows
    .filter((row) => row.studentId === studentId)
    .sort((a, b) => a.subject.name.localeCompare(b.subject.name))
    .map((row) => {
      const maxTotal = Number(row.subject.maxCaScore) + Number(row.subject.maxExamScore);
      return {
        subject: row.subject.name,
        ca: Number(row.caScore),
        exam: Number(row.examScore),
        total: Number(row.totalScore),
        maxTotal,
        percentage: maxTotal > 0 ? round2((Number(row.totalScore) / maxTotal) * 100) : 0,
        grade: row.grade,
        remark: row.remark,
      };
    });

  return NextResponse.json({
    school: { name: school?.name ?? "", address: school?.address ?? null, phone: school?.phone ?? null },
    term: { name: term.name, session: term.academicYear.name },
    student: {
      name: [student.firstName, student.middleName, student.lastName].filter(Boolean).join(" "),
      admissionNo: student.admissionNo,
      className: student.classroom.name,
    },
    subjects: ownRows,
    total: round2(ownRows.reduce((sum, row) => sum + row.total, 0)),
    maxTotal: ownRows.reduce((sum, row) => sum + row.maxTotal, 0),
    average: round2(ownAverage),
    classAverage: round2(calculateClassAverage(rankedAverages)),
    position: subjectsEntered ? calculatePosition(rankedAverages, ownAverage) : null,
    classSize: rankedIds.length,
    overallGrade: subjectsEntered ? overall.grade : null,
    overallRemark: subjectsEntered ? overall.remark : "No results entered",
    subjectsEntered,
    subjectsOffered,
    incomplete: subjectsEntered < subjectsOffered,
  });
}
