import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, isResponse, jsonError } from "@/lib/http";
import { FEE_ROLES } from "@/lib/access";
import { feeInvoiceSchema } from "@/lib/validators";
import { getFeePaymentState } from "@/lib/fees";
import { sumKobo, toKobo } from "@/lib/money";

export async function GET(request: NextRequest) {
  const user = await requireUser(FEE_ROLES);
  if (isResponse(user)) return user;
  const termId = request.nextUrl.searchParams.get("termId");
  const invoices = await prisma.feeInvoice.findMany({
    where: { schoolId: user.schoolId, ...(termId ? { termId } : {}) },
    include: {
      student: { select: { id: true, admissionNo: true, firstName: true, lastName: true, classroom: { select: { name: true } } } },
      payments: { where: { status: "SUCCESSFUL" }, select: { amount: true, paidAt: true } },
      term: true,
    },
    orderBy: { createdAt: "desc" },
    take: 5000,
  });
  const data = invoices.map((invoice) => {
    const dueKobo = toKobo(invoice.amountDue);
    const paidKobo = sumKobo(invoice.payments.map((payment) => payment.amount));
    const amountDue = dueKobo / 100;
    const amountPaid = paidKobo / 100;
    return {
      ...invoice,
      amountDue,
      amountPaid,
      outstanding: Math.max(0, dueKobo - paidKobo) / 100,
      status: getFeePaymentState(amountDue, amountPaid),
    };
  });
  return NextResponse.json({ invoices: data });
}

export async function POST(request: NextRequest) {
  const user = await requireUser(FEE_ROLES);
  if (isResponse(user)) return user;
  const parsed = feeInvoiceSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Enter a student, term, description and valid fee amount.");
  const data = parsed.data;

  const [student, term] = await Promise.all([
    prisma.student.findFirst({ where: { id: data.studentId, schoolId: user.schoolId } }),
    prisma.term.findFirst({ where: { id: data.termId, schoolId: user.schoolId } }),
  ]);
  if (!student || !term) return jsonError("Student or term not found.", 404);

  const existing = await prisma.feeInvoice.findUnique({
    where: { studentId_termId_description: { studentId: data.studentId, termId: data.termId, description: data.description } },
    include: { payments: { where: { status: "SUCCESSFUL" }, select: { amount: true } } },
  });
  if (existing) {
    const paidKobo = sumKobo(existing.payments.map((payment) => payment.amount));
    if (toKobo(data.amountDue) < paidKobo) {
      return jsonError(`This invoice already has ₦${(paidKobo / 100).toLocaleString("en-NG")} paid. The amount due cannot be lower than that.`, 409);
    }
  }

  const invoice = await prisma.feeInvoice.upsert({
    where: { studentId_termId_description: { studentId: data.studentId, termId: data.termId, description: data.description } },
    create: { schoolId: user.schoolId, studentId: data.studentId, termId: data.termId, description: data.description, amountDue: data.amountDue },
    update: { amountDue: data.amountDue },
  });
  await prisma.auditLog.create({
    data: {
      schoolId: user.schoolId,
      userId: user.id,
      action: existing ? "INVOICE_UPDATED" : "INVOICE_CREATED",
      entity: "FeeInvoice",
      entityId: invoice.id,
      metadata: { amountDue: data.amountDue, ...(existing ? { previousAmountDue: Number(existing.amountDue) } : {}) },
    },
  });
  return NextResponse.json({ invoice }, { status: existing ? 200 : 201 });
}
