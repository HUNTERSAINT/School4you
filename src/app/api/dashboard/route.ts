import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, isResponse } from "@/lib/http";

export async function GET() {
  const user = await requireUser();
  if (isResponse(user)) return user;
  const today = new Date(); today.setUTCHours(0,0,0,0);
  const tomorrow = new Date(today); tomorrow.setUTCDate(tomorrow.getUTCDate()+1);
  const [studentCount, activeStudents, activeStudentRows, invoices, payments, attendance] = await Promise.all([
    prisma.student.count({ where: { schoolId: user.schoolId } }),
    prisma.student.count({ where: { schoolId: user.schoolId, status: "ACTIVE" } }),\n    prisma.student.findMany({ where: { schoolId: user.schoolId, status: "ACTIVE" }, select: { id: true } }),
    prisma.feeInvoice.findMany({ where: { schoolId: user.schoolId }, include: { payments: { where: { status: "SUCCESSFUL" }, select: { amount: true } } } }),
    prisma.payment.aggregate({ where: { schoolId: user.schoolId, status: "SUCCESSFUL" }, _sum: { amount: true }, _count: true }),
    prisma.attendanceRecord.findMany({ where: { session: { schoolId: user.schoolId, date: { gte: today, lt: tomorrow } } }, select: { status: true } }),
  ]);
  let fullyPaid=0, partiallyPaid=0, unpaid=0, outstanding=0, invoiced=0;
  for (const invoice of invoices) {
    const due=Number(invoice.amountDue), paid=invoice.payments.reduce((sum,p)=>sum+Number(p.amount),0);
    invoiced+=due; outstanding+=Math.max(0,due-paid);
    if(paid<=0) unpaid++; else if(paid<due) partiallyPaid++; else fullyPaid++;
  }
  const present=attendance.filter(a=>a.status==="PRESENT"||a.status==="LATE").length;
  return NextResponse.json({
    students:{total:studentCount,active:activeStudents},
    fees:{invoices:invoices.length,fullyPaid,partiallyPaid,unpaid,collected:Number(payments._sum.amount||0),outstanding,invoiced},
    attendance:{marked:attendance.length,present,absent:attendance.filter(a=>a.status==="ABSENT").length,rate:attendance.length?Math.round(present/attendance.length*100):0},
  });
}
