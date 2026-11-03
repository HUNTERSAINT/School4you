import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/auth";
import { isUniqueViolation, jsonError, logError } from "@/lib/http";
import { onboardingSchema } from "@/lib/validators";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { defaultAcademicYear } from "@/lib/terms";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const limit = rateLimit(`register:ip:${clientIp(request.headers)}`, 5, 60 * 60 * 1000);
  if (!limit.ok) {
    return jsonError("Too many registrations from this connection. Please try again later.", 429, { "Retry-After": String(limit.retryAfter) });
  }

  const parsed = onboardingSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Please check the school and administrator details.");
  const data = parsed.data;

  try {
    const existing = await prisma.user.findUnique({ where: { email: data.adminEmail } });
    if (existing) return jsonError("An account with this email already exists.", 409);
  } catch (error) {
    logError("register-school:lookup", error);
    return jsonError("We could not reach the database. Please try again in a moment.", 503);
  }

  const base = data.schoolName.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 45) || "school";
  const slug = `${base}-${randomUUID().slice(0, 6)}`;
  const passwordHash = await hash(data.password, 12);
  const year = defaultAcademicYear();

  try {
    const created = await prisma.$transaction(async (tx) => {
      const school = await tx.school.create({
        data: { name: data.schoolName, slug, email: data.schoolEmail || null, phone: data.schoolPhone || null, address: data.schoolAddress || null },
      });
      const user = await tx.user.create({ data: { schoolId: school.id, name: data.adminName, email: data.adminEmail, passwordHash, role: "SCHOOL_ADMIN" } });
      const academicYear = await tx.academicYear.create({
        data: { schoolId: school.id, name: year.name, startsAt: year.startsAt, endsAt: year.endsAt, isCurrent: true },
      });
      await tx.term.create({
        data: { schoolId: school.id, academicYearId: academicYear.id, name: "First Term", startsAt: year.startsAt, endsAt: year.firstTermEndsAt, isCurrent: true },
      });
      await tx.auditLog.create({ data: { schoolId: school.id, userId: user.id, action: "SCHOOL_CREATED", entity: "School", entityId: school.id } });
      return { school, user };
    });
    await createSession(
      { id: created.user.id, email: created.user.email, name: created.user.name, role: created.user.role, schoolId: created.school.id },
      created.user.sessionVersion,
    );
    return NextResponse.json(
      { school: { id: created.school.id, name: created.school.name, slug: created.school.slug }, user: { name: created.user.name, email: created.user.email } },
      { status: 201 },
    );
  } catch (error) {
    if (isUniqueViolation(error)) return jsonError("An account with this email already exists.", 409);
    logError("register-school", error);
    return jsonError("We could not create the school right now. Please try again.", 500);
  }
}
