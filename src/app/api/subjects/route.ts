import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser, isResponse, jsonError } from "@/lib/http";

export async function GET(request: NextRequest) {
  const user = await requireUser();
  if (isResponse(user)) return user;
  const classroomId = request.nextUrl.searchParams.get("classroomId");
  const subjects = await prisma.subject.findMany({ where: { schoolId: user.schoolId, ...(classroomId ? { classroomId } : {}) }, orderBy: { name: "asc" } });
  return NextResponse.json({ subjects });
}
export async function POST(request: NextRequest) {
  const user = await requireUser(["SCHOOL_ADMIN", "SUPER_ADMIN"]);
  if (isResponse(user)) return user;
  const parsed = z.object({ classroomId: z.string().min(1), name: z.string().trim().min(2).max(80), maxCaScore: z.number().positive().max(100).default(30), maxExamScore: z.number().positive().max(100).default(70) }).safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError("Enter a subject, class and valid score limits.");
  const classroom = await prisma.classroom.findFirst({ where: { id: parsed.data.classroomId, schoolId: user.schoolId } });
  if (!classroom) return jsonError("Class not found.", 404);
  try {
    const subject = await prisma.subject.create({ data: { schoolId: user.schoolId, classroomId: classroom.id, name: parsed.data.name, maxCaScore: parsed.data.maxCaScore, maxExamScore: parsed.data.maxExamScore } });
    return NextResponse.json({ subject }, { status: 201 });
  } catch { return jsonError("That subject already exists in this class.", 409); }
}
