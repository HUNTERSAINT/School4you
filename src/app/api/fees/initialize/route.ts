import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { requireUser, isResponse, jsonError, logError } from "@/lib/http";
import { FEE_ROLES } from "@/lib/access";
import { initializePaymentSchema } from "@/lib/validators";
import { sumKobo, toKobo } from "@/lib/money";

export const runtime = "nodejs";

// A started-but-unfinished checkout holds its amount for this long, so two quick clicks
// cannot create two full-balance payments that would both succeed.
const PENDING_HOLD_MS = 60 * 60 * 1000;

export async function POST(request: NextRequest) {
  const user = await requireUser(FEE_ROLES);
  if (isResponse(user)) return user;
  const parsed = initializePaymentSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError("Provide a valid invoice, amount and payer email.");
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) return jsonError("Paystack has not been configured by the school administrator.", 503);

  const invoice = await prisma.feeInvoice.findFirst({
    where: { id: parsed.data.invoiceId, schoolId: user.schoolId },
    include: { payments: { where: { OR: [{ status: "SUCCESSFUL" }, { status: "PENDING", createdAt: { gte: new Date(Date.now() - PENDING_HOLD_MS) } }] } } },
  });
  if (!invoice) return jsonError("Fee invoice not found.", 404);

  const paidKobo = sumKobo(invoice.payments.filter((p) => p.status === "SUCCESSFUL").map((p) => p.amount));
  const pendingKobo = sumKobo(invoice.payments.filter((p) => p.status === "PENDING").map((p) => p.amount));
  const outstandingKobo = toKobo(invoice.amountDue) - paidKobo;
  if (outstandingKobo <= 0) return jsonError("This invoice is already fully paid.");
  const availableKobo = outstandingKobo - pendingKobo;
  if (availableKobo <= 0) return jsonError("A payment for the full balance is already in progress. Wait for it to finish, or try again in an hour.", 409);
  if (toKobo(parsed.data.amount) > availableKobo) {
    return jsonError(`Payment cannot exceed the available balance of ₦${(availableKobo / 100).toLocaleString("en-NG")}.`);
  }

  const reference = `S4Y-${randomUUID()}`;
  const payment = await prisma.payment.create({
    data: { schoolId: user.schoolId, studentId: invoice.studentId, invoiceId: invoice.id, amount: parsed.data.amount, currency: "NGN", gatewayReference: reference },
  });

  try {
    const response = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: { Authorization: `Bearer ${secret}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        email: parsed.data.email,
        amount: toKobo(parsed.data.amount),
        reference,
        callback_url: `${process.env.AUTH_URL || request.nextUrl.origin}/fees/verify`,
        metadata: { schoolId: user.schoolId, invoiceId: invoice.id, paymentId: payment.id },
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    });
    const result = await response.json().catch(() => null);
    if (!response.ok || !result?.status || !result?.data?.authorization_url) throw new Error(`Paystack responded with ${response.status}`);
    return NextResponse.json({ authorizationUrl: result.data.authorization_url, reference });
  } catch (error) {
    logError("fees:initialize", error);
    await prisma.payment.update({ where: { id: payment.id }, data: { status: "FAILED" } });
    return jsonError("Could not initialize payment with Paystack.", 502);
  }
}
