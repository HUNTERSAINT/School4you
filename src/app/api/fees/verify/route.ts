import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, isResponse, jsonError, logError } from "@/lib/http";
import { FEE_ROLES } from "@/lib/access";
import { confirmPayment } from "@/lib/payments";
import { toKobo } from "@/lib/money";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const user = await requireUser(FEE_ROLES);
  if (isResponse(user)) return user;
  const body = await request.json().catch(() => null);
  const reference = typeof body?.reference === "string" ? body.reference : "";
  if (!reference) return jsonError("Payment reference is required.");
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) return jsonError("Payment gateway is not configured.", 503);

  const payment = await prisma.payment.findFirst({ where: { gatewayReference: reference, schoolId: user.schoolId } });
  if (!payment) return jsonError("Payment record not found.", 404);
  if (payment.status === "SUCCESSFUL") return NextResponse.json({ verified: true, status: "SUCCESSFUL" });

  let result: { status?: boolean; data?: { status?: string; amount?: number; currency?: string; id?: unknown; paid_at?: unknown } } | null;
  try {
    const response = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
      headers: { Authorization: `Bearer ${secret}` },
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    });
    result = response.ok ? await response.json().catch(() => null) : null;
  } catch (error) {
    logError("fees:verify", error);
    return jsonError("We could not reach Paystack. Please try again shortly.", 502);
  }

  if (result?.status && result.data?.status === "failed") {
    await prisma.payment.updateMany({ where: { id: payment.id, status: "PENDING" }, data: { status: "FAILED" } });
    return jsonError("Paystack reports that this payment failed.", 409);
  }
  if (!result?.status || result.data?.status !== "success") return jsonError("Paystack has not confirmed this payment.", 409);
  if (Number(result.data.amount) !== toKobo(payment.amount) || result.data.currency !== "NGN") {
    return jsonError("Verified payment amount does not match the invoice.", 400);
  }

  await confirmPayment(payment.id, result.data, user.id, "FEE_PAYMENT_VERIFIED");
  return NextResponse.json({ verified: true, status: "SUCCESSFUL" });
}
