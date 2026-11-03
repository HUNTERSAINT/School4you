import { prisma } from "@/lib/prisma";
import type { SessionUser } from "@/lib/auth";

export const ADMIN_ROLES = ["SCHOOL_ADMIN", "SUPER_ADMIN"] as const;
export const FEE_ROLES = ["SCHOOL_ADMIN", "SUPER_ADMIN", "BURSAR"] as const;
export const ACADEMIC_ROLES = ["SCHOOL_ADMIN", "SUPER_ADMIN", "TEACHER"] as const;

export function isAdmin(user: SessionUser) {
  return user.role === "SCHOOL_ADMIN" || user.role === "SUPER_ADMIN";
}

/**
 * Which classes this user may work with.
 * `null` means no restriction (admins, bursars); an array means only those classes (teachers).
 */
export async function classScope(user: SessionUser): Promise<string[] | null> {
  if (user.role !== "TEACHER") return null;
  const rows = await prisma.teacherAssignment.findMany({
    where: { schoolId: user.schoolId, userId: user.id },
    select: { classroomId: true },
  });
  return rows.map((row) => row.classroomId);
}

export async function canAccessClass(user: SessionUser, classroomId: string) {
  const scope = await classScope(user);
  return scope === null || scope.includes(classroomId);
}
