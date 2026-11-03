export type FeePaymentState = "UNPAID" | "PART_PAYMENT" | "PAID";

export function getFeePaymentState(amountDue: number, amountPaid: number): FeePaymentState {
  if (!Number.isFinite(amountDue) || !Number.isFinite(amountPaid) || amountDue < 0 || amountPaid < 0) {
    throw new Error("Fee amounts must be valid non-negative numbers.");
  }
  if (amountPaid <= 0) return "UNPAID";
  if (amountPaid < amountDue) return "PART_PAYMENT";
  return "PAID";
}

export function getOutstandingBalance(amountDue: number, amountPaid: number) {
  return Math.max(0, amountDue - amountPaid);
}
