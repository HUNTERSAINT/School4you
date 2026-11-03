import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser, isResponse, jsonError } from "@/lib/http";

export const runtime = "nodejs";
export async function POST(request: NextRequest) {
  const user = await requireUser(["SCHOOL_ADMIN", "BURSAR", "SUPER_ADMIN"]);
  if (isResponse(user)) return user;
  const parsed = z.object({ invoiceId: z.string().min(1), amount: z.number().positive().max(100000000), email: z.string().email() }).safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError("Provide a valid invoice, amount and payer email.");
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) return jsonError("Paystack has not been configured by the school administrator.", 503);
  const invoice = await prisma.feeInvoice.findFirst({ where: { id: parsed.data.invoiceId, schoolId: user.schoolId }, include: { payments: { where: { status: "SUCCESSFUL" } } } });
  if (!invoice) return jsonError("Fee invoice not found.", 404);
  const paid = invoice.payments.reduce((sum, p) => sum + Number(p.amount), 0);
  const balance = Number(invoice.amountDue) - paid;
  if (balance <= 0) return jsonError("This invoice is already fully paid.");
  if (parsed.data.amount > balance) return jsonError("Payment cannot exceed the outstanding balance.");
  const reference = `S4Y-${randomUUID()}`;
  const payment = await prisma.payment.create({ data: { schoolId: user.schoolId, studentId: invoice.studentId, invoiceId: invoice.id, amount: parsed.data.amount, currency: "NGN", gatewayReference: reference } });
  const response = await fetch("https://api.paystack.co/transaction/initialize", {
    method: "POST", headers: { Authorization: `Bearer ${secret}`, "Content-Type": "application/json" },
    body: JSON.stringify({ email: parsed.data.email, amount: Math.round(parsed.data.amount * 100), reference, callback_url: `${process.env.AUTH_URL || request.nextUrl.origin}/fees/verify`, metadata: { schoolId: user.schoolId, invoiceId: invoice.id, paymentId: payment.id } }),
    cache: "no-store",
  });
  const result = await response.json().catch(() => null);
  if (!response.ok || !result?.status || !result?.data?.authorization_url) {
    await prisma.payment.update({ where: { id: payment.id }, data: { status: "FAILED" } });
    return jsonError("Could not initialize payment with Paystack.", 502);
  }
  return NextResponse.json({ authorizationUrl: result.data.authorization_url, reference });
}
