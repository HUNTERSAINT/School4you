import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, isResponse, jsonError } from "@/lib/http";
import { feeInvoiceSchema } from "@/lib/validators";

export async function GET(request: NextRequest) {
  const user = await requireUser();
  if (isResponse(user)) return user;
  const termId = request.nextUrl.searchParams.get("termId");
  const invoices = await prisma.feeInvoice.findMany({
    where: { schoolId: user.schoolId, ...(termId ? { termId } : {}) },
    include: { student: { select: { id: true, admissionNo: true, firstName: true, lastName: true, classroom: { select: { name: true } } } }, payments: { where: { status: "SUCCESSFUL" }, select: { amount: true, paidAt: true } }, term: true },
    orderBy: { createdAt: "desc" },
  });
  const data = invoices.map(invoice => {
    const paid = invoice.payments.reduce((sum, payment) => sum + Number(payment.amount), 0);
    return { ...invoice, amountDue: Number(invoice.amountDue), amountPaid: paid, outstanding: Math.max(0, Number(invoice.amountDue) - paid), status: paid <= 0 ? "UNPAID" : paid < Number(invoice.amountDue) ? "PART_PAYMENT" : "PAID" };
  });
  return NextResponse.json({ invoices: data });
}
export async function POST(request: NextRequest) {
  const user = await requireUser(["SCHOOL_ADMIN", "BURSAR", "SUPER_ADMIN"]);
  if (isResponse(user)) return user;
  const parsed = feeInvoiceSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError("Enter a student, term, description and valid fee amount.");
  const data = parsed.data;
  const [student, term] = await Promise.all([
    prisma.student.findFirst({ where: { id: data.studentId, schoolId: user.schoolId } }),
    prisma.term.findFirst({ where: { id: data.termId, schoolId: user.schoolId } }),
  ]);
  if (!student || !term) return jsonError("Student or term not found.", 404);
  const invoice = await prisma.feeInvoice.upsert({
    where: { studentId_termId_description: { studentId: data.studentId, termId: data.termId, description: data.description } },
    create: { schoolId: user.schoolId, studentId: data.studentId, termId: data.termId, description: data.description, amountDue: data.amountDue },
    update: { amountDue: data.amountDue },
  });
  return NextResponse.json({ invoice }, { status: 201 });
}
