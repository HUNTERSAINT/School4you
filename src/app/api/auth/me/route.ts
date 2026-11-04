import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await getSession();
  if (!user) return NextResponse.json({ user: null }, { status: 401 });
  const [school, record] = await Promise.all([
    prisma.school.findUnique({ where: { id: user.schoolId }, select: { name: true } }),
    prisma.user.findUnique({ where: { id: user.id }, select: { emailVerifiedAt: true } }),
  ]);
  return NextResponse.json({ user: { ...user, schoolName: school?.name ?? "", emailVerified: Boolean(record?.emailVerifiedAt) } });
}
