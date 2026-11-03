import { createHmac, timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { confirmPayment } from "@/lib/payments";
import { toKobo } from "@/lib/money";

export const runtime = "nodejs";

type PaystackEvent = {
  event?: string;
  data?: { reference?: unknown; amount?: unknown; currency?: unknown; id?: unknown; paid_at?: unknown };
};

export async function POST(request: NextRequest) {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  const signature = request.headers.get("x-paystack-signature");
  if (!secret || !signature) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rawBody = await request.text();
  const digest = createHmac("sha512", secret).update(rawBody).digest("hex");
  const supplied = Buffer.from(signature);
  const expected = Buffer.from(digest);
  if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) return NextResponse.json({ error: "Invalid signature" }, { status: 401 });

  let event: PaystackEvent;
  try {
    event = JSON.parse(rawBody) as PaystackEvent;
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
  if (event.event !== "charge.success" || !event.data?.reference) return NextResponse.json({ received: true });

  const payment = await prisma.payment.findUnique({ where: { gatewayReference: String(event.data.reference) } });
  if (!payment || payment.status === "SUCCESSFUL") return NextResponse.json({ received: true });

  if (Number(event.data.amount) !== toKobo(payment.amount) || event.data.currency !== "NGN") {
    // Money moved but not the amount we expected. Record it for a human to review and stop Paystack's retries.
    await prisma.auditLog.create({
      data: {
        schoolId: payment.schoolId,
        action: "FEE_PAYMENT_MISMATCH",
        entity: "Payment",
        entityId: payment.id,
        metadata: { reference: payment.gatewayReference, expectedKobo: toKobo(payment.amount), receivedKobo: Number(event.data.amount) || null },
      },
    });
    return NextResponse.json({ received: true });
  }

  await confirmPayment(payment.id, event.data, null, "FEE_PAYMENT_CONFIRMED");
  return NextResponse.json({ received: true });
}
