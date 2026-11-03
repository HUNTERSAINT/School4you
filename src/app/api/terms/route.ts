import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, isResponse, jsonError, isUniqueViolation, logError } from "@/lib/http";
import { ADMIN_ROLES } from "@/lib/access";
import { termCreateSchema } from "@/lib/validators";
import { dateOnlyToUtc } from "@/lib/dates";
import { setCurrentTerm } from "@/lib/terms";

export async function GET() {
  const user = await requireUser();
  if (isResponse(user)) return user;
  const terms = await prisma.term.findMany({
    where: { schoolId: user.schoolId },
    include: { academicYear: true },
    orderBy: [{ academicYear: { startsAt: "desc" } }, { startsAt: "asc" }],
  });
  return NextResponse.json({ terms });
}

export async function POST(request: NextRequest) {
  const user = await requireUser(ADMIN_ROLES);
  if (isResponse(user)) return user;
  const parsed = termCreateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Check the session, term name and dates.");
  const { academicYear, name, makeCurrent } = parsed.data;
  const startsAt = dateOnlyToUtc(parsed.data.startsAt);
  const endsAt = dateOnlyToUtc(parsed.data.endsAt);

  try {
    const term = await prisma.$transaction(async (tx) => {
      let year = await tx.academicYear.findUnique({ where: { schoolId_name: { schoolId: user.schoolId, name: academicYear } } });
      if (!year) {
        year = await tx.academicYear.create({ data: { schoolId: user.schoolId, name: academicYear, startsAt, endsAt } });
      } else if (startsAt < year.startsAt || endsAt > year.endsAt) {
        year = await tx.academicYear.update({
          where: { id: year.id },
          data: { startsAt: startsAt < year.startsAt ? startsAt : year.startsAt, endsAt: endsAt > year.endsAt ? endsAt : year.endsAt },
        });
      }
      const created = await tx.term.create({ data: { schoolId: user.schoolId, academicYearId: year.id, name, startsAt, endsAt } });
      const hasCurrent = await tx.term.findFirst({ where: { schoolId: user.schoolId, isCurrent: true }, select: { id: true } });
      const result = makeCurrent || !hasCurrent ? await setCurrentTerm(tx, user.schoolId, created.id) : created;
      await tx.auditLog.create({ data: { schoolId: user.schoolId, userId: user.id, action: "TERM_CREATED", entity: "Term", entityId: created.id } });
      return result;
    });
    return NextResponse.json({ term }, { status: 201 });
  } catch (error) {
    if (isUniqueViolation(error)) return jsonError("That term already exists in this session.", 409);
    logError("terms:create", error);
    return jsonError("The term could not be created. Please try again.", 500);
  }
}
