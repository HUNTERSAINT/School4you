import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, isResponse, jsonError, isUniqueViolation, logError } from "@/lib/http";
import { ADMIN_ROLES } from "@/lib/access";
import { termUpdateSchema } from "@/lib/validators";
import { dateOnlyToUtc } from "@/lib/dates";
import { setCurrentTerm } from "@/lib/terms";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Context) {
  const user = await requireUser(ADMIN_ROLES);
  if (isResponse(user)) return user;
  const { id } = await params;
  const parsed = termUpdateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Check the term details.");
  const existing = await prisma.term.findFirst({ where: { id, schoolId: user.schoolId }, include: { academicYear: true } });
  if (!existing) return jsonError("Term not found.", 404);

  const startsAt = parsed.data.startsAt ? dateOnlyToUtc(parsed.data.startsAt) : existing.startsAt;
  const endsAt = parsed.data.endsAt ? dateOnlyToUtc(parsed.data.endsAt) : existing.endsAt;
  if (endsAt <= startsAt) return jsonError("The end date must be after the start date.");

  try {
    const term = await prisma.$transaction(async (tx) => {
      const updated = await tx.term.update({ where: { id }, data: { name: parsed.data.name ?? undefined, startsAt, endsAt } });
      const year = existing.academicYear;
      if (startsAt < year.startsAt || endsAt > year.endsAt) {
        await tx.academicYear.update({
          where: { id: year.id },
          data: { startsAt: startsAt < year.startsAt ? startsAt : year.startsAt, endsAt: endsAt > year.endsAt ? endsAt : year.endsAt },
        });
      }
      const result = parsed.data.makeCurrent ? await setCurrentTerm(tx, user.schoolId, id) : updated;
      await tx.auditLog.create({
        data: { schoolId: user.schoolId, userId: user.id, action: parsed.data.makeCurrent ? "TERM_SET_CURRENT" : "TERM_UPDATED", entity: "Term", entityId: id },
      });
      return result;
    });
    return NextResponse.json({ term });
  } catch (error) {
    if (isUniqueViolation(error)) return jsonError("Another term in this session already has that name.", 409);
    logError("terms:update", error);
    return jsonError("The term could not be updated. Please try again.", 500);
  }
}
