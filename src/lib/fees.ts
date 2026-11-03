import { toKobo } from "./money.ts";

export type FeePaymentState = "UNPAID" | "PART_PAYMENT" | "PAID";

function assertAmounts(amountDue: number, amountPaid: number) {
  if (!Number.isFinite(amountDue) || !Number.isFinite(amountPaid) || amountDue < 0 || amountPaid < 0) {
    throw new Error("Fee amounts must be valid non-negative numbers.");
  }
}

export function getFeePaymentState(amountDue: number, amountPaid: number): FeePaymentState {
  assertAmounts(amountDue, amountPaid);
  const due = toKobo(amountDue);
  const paid = toKobo(amountPaid);
  if (paid <= 0) return "UNPAID";
  if (paid < due) return "PART_PAYMENT";
  return "PAID";
}

export function getOutstandingBalance(amountDue: number, amountPaid: number): number {
  assertAmounts(amountDue, amountPaid);
  return Math.max(0, toKobo(amountDue) - toKobo(amountPaid)) / 100;
}
