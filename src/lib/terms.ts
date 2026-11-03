import type { Prisma } from "@prisma/client";

/** Academic years in Nigeria run roughly September to July. */
export function defaultAcademicYear(now: Date = new Date()) {
  const startYear = now.getUTCMonth() >= 7 ? now.getUTCFullYear() : now.getUTCFullYear() - 1;
  return {
    name: `${startYear}/${startYear + 1}`,
    startsAt: new Date(Date.UTC(startYear, 8, 1)),
    endsAt: new Date(Date.UTC(startYear + 1, 6, 31, 23, 59, 59)),
    firstTermEndsAt: new Date(Date.UTC(startYear, 11, 18, 23, 59, 59)),
  };
}

/** Makes one term (and its session) the current one; every other term stops being current. */
export async function setCurrentTerm(tx: Prisma.TransactionClient, schoolId: string, termId: string) {
  await tx.term.updateMany({ where: { schoolId, isCurrent: true }, data: { isCurrent: false } });
  await tx.academicYear.updateMany({ where: { schoolId, isCurrent: true }, data: { isCurrent: false } });
  const term = await tx.term.update({ where: { id: termId }, data: { isCurrent: true } });
  await tx.academicYear.update({ where: { id: term.academicYearId }, data: { isCurrent: true } });
  return term;
}
