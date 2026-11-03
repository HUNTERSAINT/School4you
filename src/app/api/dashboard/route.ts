import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, isResponse } from "@/lib/http";
import { FEE_ROLES } from "@/lib/access";
import { dateInZone, dayRange } from "@/lib/dates";
import { fromKobo, sumKobo, toKobo } from "@/lib/money";

export async function GET() {
  const user = await requireUser();
  if (isResponse(user)) return user;

  const school = await prisma.school.findUnique({ where: { id: user.schoolId }, select: { name: true, timezone: true } });
  const { start, end } = dayRange(dateInZone(school?.timezone ?? "Africa/Lagos"));
  const canSeeFees = (FEE_ROLES as readonly string[]).includes(user.role);

  const [studentTotal, studentActive, attendance] = await Promise.all([
    prisma.student.count({ where: { schoolId: user.schoolId } }),
    prisma.student.count({ where: { schoolId: user.schoolId, status: "ACTIVE" } }),
    prisma.attendanceRecord.groupBy({
      by: ["status"],
      where: { session: { schoolId: user.schoolId, date: { gte: start, lt: end } } },
      _count: { _all: true },
    }),
  ]);

  const count = (status: string) => attendance.find((row) => row.status === status)?._count._all ?? 0;
  const marked = attendance.reduce((sum, row) => sum + row._count._all, 0);
  const present = count("PRESENT") + count("LATE");

  type FeeStats = {
    term: string | null;
    invoices: number;
    fullyPaid: number;
    partiallyPaid: number;
    unpaid: number;
    collected: number;
    outstanding: number;
    invoiced: number;
  };
  let fees: FeeStats | null = null;
  if (canSeeFees) {
    // Fee figures describe the current term, so they stay meaningful as terms roll over.
    const term = await prisma.term.findFirst({ where: { schoolId: user.schoolId, isCurrent: true }, select: { id: true, name: true, academicYear: { select: { name: true } } } });
    const termFilter = term ? { termId: term.id } : {};
    const [invoices, paidByInvoice] = await Promise.all([
      prisma.feeInvoice.findMany({ where: { schoolId: user.schoolId, ...termFilter }, select: { id: true, amountDue: true } }),
      prisma.payment.groupBy({
        by: ["invoiceId"],
        where: { schoolId: user.schoolId, status: "SUCCESSFUL", invoice: termFilter },
        _sum: { amount: true },
      }),
    ]);
    const paidMap = new Map<string, number>(paidByInvoice.map((row): [string, number] => [row.invoiceId, toKobo(row._sum.amount ?? 0)]));
    let fullyPaid = 0;
    let partiallyPaid = 0;
    let unpaid = 0;
    let outstandingKobo = 0;
    let invoicedKobo = 0;
    for (const invoice of invoices) {
      const due = toKobo(invoice.amountDue);
      const paid = paidMap.get(invoice.id) ?? 0;
      invoicedKobo += due;
      outstandingKobo += Math.max(0, due - paid);
      if (paid <= 0) unpaid++;
      else if (paid < due) partiallyPaid++;
      else fullyPaid++;
    }
    fees = {
      term: term ? `${term.name} · ${term.academicYear.name}` : null,
      invoices: invoices.length,
      fullyPaid,
      partiallyPaid,
      unpaid,
      collected: fromKobo(sumKobo(paidMap.values())),
      outstanding: fromKobo(outstandingKobo),
      invoiced: fromKobo(invoicedKobo),
    };
  }

  return NextResponse.json({
    school: { name: school?.name ?? "" },
    students: { total: studentTotal, active: studentActive },
    fees,
    attendance: {
      marked,
      present,
      absent: count("ABSENT"),
      rate: marked ? Math.round((present / marked) * 100) : 0,
    },
  });
}
