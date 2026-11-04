import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { isResponse, jsonError, requireUser } from "@/lib/http";
import { ADMIN_ROLES } from "@/lib/access";
import { isValidSubaccountCode } from "@/lib/paystack";

export async function GET() {
  const user = await requireUser(ADMIN_ROLES);
  if (isResponse(user)) return user;
  const school = await prisma.school.findUnique({
    where: { id: user.schoolId },
    select: { name: true, email: true, phone: true, address: true, paystackSubaccountCode: true, termsAcceptedAt: true, termsVersion: true },
  });
  return NextResponse.json({ school, platformPaymentsAllowed: process.env.PAYSTACK_ALLOW_PLATFORM_ACCOUNT === "true" });
}

export async function PATCH(request: NextRequest) {
  const user = await requireUser(ADMIN_ROLES);
  if (isResponse(user)) return user;
  const parsed = z
    .object({
      name: z.string().trim().min(2).max(120).optional(),
      phone: z.string().trim().max(30).optional(),
      address: z.string().trim().max(250).optional(),
      paystackSubaccountCode: z.string().trim().max(60).optional(),
    })
    .safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError("Check the school details.");
  const { paystackSubaccountCode, ...rest } = parsed.data;
  if (paystackSubaccountCode && !isValidSubaccountCode(paystackSubaccountCode)) {
    return jsonError("A Paystack subaccount code looks like ACCT_xxxxxxxxxx. Copy it from your Paystack dashboard.");
  }
  const school = await prisma.school.update({
    where: { id: user.schoolId },
    data: { ...rest, ...(paystackSubaccountCode === undefined ? {} : { paystackSubaccountCode: paystackSubaccountCode || null }) },
    select: { name: true, phone: true, address: true, paystackSubaccountCode: true },
  });
  await prisma.auditLog.create({
    data: { schoolId: user.schoolId, userId: user.id, action: "SCHOOL_UPDATED", entity: "School", entityId: user.schoolId, metadata: { fields: Object.keys(parsed.data) } },
  });
  return NextResponse.json({ school });
}
