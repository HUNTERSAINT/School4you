import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, isResponse } from "@/lib/http";
export async function GET() {
  const user = await requireUser();
  if (isResponse(user)) return user;
  const terms = await prisma.term.findMany({ where: { schoolId: user.schoolId }, include: { academicYear: true }, orderBy: [{ academicYear: { startsAt: "desc" } }, { startsAt: "asc" }] });
  return NextResponse.json({ terms });
}
