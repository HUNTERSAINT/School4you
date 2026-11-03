import { createHmac, timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export async function POST(request: NextRequest) {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  const signature = request.headers.get("x-paystack-signature");
  if (!secret || !signature) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const rawBody = await request.text();
  const digest = createHmac("sha512", secret).update(rawBody).digest("hex");
  const supplied = Buffer.from(signature);
  const expected = Buffer.from(digest);
  if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  let event: any;
  try { event = JSON.parse(rawBody); } catch { return NextResponse.json({ error: "Invalid payload" }, { status: 400 }); }
  if (event.event !== "charge.success" || !event.data?.reference) return NextResponse.json({ received: true });
  const payment = await prisma.payment.findUnique({ where: { gatewayReference: String(event.data.reference) } });
  if (!payment || payment.status === "SUCCESSFUL") return NextResponse.json({ received: true });
  const expectedKobo = Math.round(Number(payment.amount) * 100);
  if (Number(event.data.amount) !== expectedKobo || event.data.currency !== "NGN") return NextResponse.json({ error: "Payment amount mismatch" }, { status: 400 });
  await prisma.$transaction(async tx => {
    await tx.payment.update({ where: { id: payment.id }, data: { status: "SUCCESSFUL", gatewayPaymentId: String(event.data.id), paidAt: event.data.paid_at ? new Date(event.data.paid_at) : new Date(), verifiedAt: new Date() } });
    await tx.auditLog.create({ data: { schoolId: payment.schoolId, action: "FEE_PAYMENT_CONFIRMED", entity: "Payment", entityId: payment.id, metadata: { reference: payment.gatewayReference, amount: Number(payment.amount) } } });
  });
  return NextResponse.json({ received: true });
}
