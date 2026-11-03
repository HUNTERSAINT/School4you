import { prisma } from "@/lib/prisma";
import { sumKobo, toKobo } from "@/lib/money";

type GatewayDetails = { id?: unknown; paid_at?: unknown };

function parsePaidAt(value: unknown): Date {
  if (typeof value === "string") {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  return new Date();
}

/**
 * Marks a payment successful exactly once, even if the webhook and the browser callback race.
 * Records an audit entry, and flags the entry when the invoice has been paid more than it owes.
 */
export async function confirmPayment(paymentId: string, gateway: GatewayDetails, actorUserId: string | null, action: string) {
  return prisma.$transaction(async (tx) => {
    const payment = await tx.payment.findUnique({ where: { id: paymentId } });
    if (!payment) return { changed: false, excess: 0 };

    const claimed = await tx.payment.updateMany({
      where: { id: paymentId, status: { not: "SUCCESSFUL" } },
      data: {
        status: "SUCCESSFUL",
        gatewayPaymentId: gateway.id === undefined || gateway.id === null ? null : String(gateway.id),
        paidAt: parsePaidAt(gateway.paid_at),
        verifiedAt: new Date(),
      },
    });
    if (claimed.count === 0) return { changed: false, excess: 0 };

    const invoice = await tx.feeInvoice.findUnique({ where: { id: payment.invoiceId }, select: { amountDue: true } });
    const successful = await tx.payment.findMany({ where: { invoiceId: payment.invoiceId, status: "SUCCESSFUL" }, select: { amount: true } });
    const excessKobo = Math.max(0, sumKobo(successful.map((p) => p.amount)) - toKobo(invoice?.amountDue ?? 0));

    await tx.auditLog.create({
      data: {
        schoolId: payment.schoolId,
        userId: actorUserId,
        action: excessKobo > 0 ? `${action}_OVERPAID` : action,
        entity: "Payment",
        entityId: payment.id,
        metadata: {
          reference: payment.gatewayReference,
          amount: Number(payment.amount),
          ...(excessKobo > 0 ? { excess: excessKobo / 100 } : {}),
        },
      },
    });
    return { changed: true, excess: excessKobo / 100 };
  });
}
