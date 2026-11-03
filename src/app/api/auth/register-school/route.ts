import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/auth";
import { jsonError } from "@/lib/http";
import { onboardingSchema } from "@/lib/validators";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const parsed = onboardingSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError("Please check the school and administrator details.");
  const data = parsed.data;
  const existing = await prisma.user.findUnique({ where: { email: data.adminEmail.toLowerCase() } });
  if (existing) return jsonError("An account with this email already exists.", 409);
  const base = data.schoolName.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 45) || "school";
  const slug = `${base}-${crypto.randomUUID().slice(0, 6)}`;
  const passwordHash = await hash(data.password, 12);
  const school = await prisma.$transaction(async tx => {
    const created = await tx.school.create({ data: { name: data.schoolName, slug, email: data.schoolEmail || null, phone: data.schoolPhone || null, address: data.schoolAddress || null } });
    const user = await tx.user.create({ data: { schoolId: created.id, name: data.adminName, email: data.adminEmail.toLowerCase(), passwordHash, role: "SCHOOL_ADMIN" } });
    const year = await tx.academicYear.create({ data: { schoolId: created.id, name: "2026/2027", startsAt: new Date("2026-09-01T00:00:00.000Z"), endsAt: new Date("2027-07-31T23:59:59.000Z"), isCurrent: true } });
    await tx.term.create({ data: { schoolId: created.id, academicYearId: year.id, name: "First Term", startsAt: new Date("2026-09-01T00:00:00.000Z"), endsAt: new Date("2026-12-18T23:59:59.000Z"), isCurrent: true } });
    await tx.auditLog.create({ data: { schoolId: created.id, userId: user.id, action: "SCHOOL_CREATED", entity: "School", entityId: created.id } });
    return { school: created, user };
  });
  await createSession({ id: school.user.id, email: school.user.email, name: school.user.name, role: school.user.role, schoolId: school.school.id });
  return NextResponse.json({ school: { id: school.school.id, name: school.school.name, slug: school.school.slug }, user: { name: school.user.name, email: school.user.email } }, { status: 201 });
}
