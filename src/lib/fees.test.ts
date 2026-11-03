import { test } from "node:test";
import assert from "node:assert/strict";
import { getFeePaymentState, getOutstandingBalance } from "./fees.ts";
import { fromKobo, sumKobo, toKobo } from "./money.ts";

test("payment state across unpaid, part and full payment", () => {
  assert.equal(getFeePaymentState(50000, 0), "UNPAID");
  assert.equal(getFeePaymentState(50000, 20000), "PART_PAYMENT");
  assert.equal(getFeePaymentState(50000, 50000), "PAID");
  assert.equal(getFeePaymentState(50000, 60000), "PAID");
});

test("floating point sums that should equal the amount due count as paid", () => {
  assert.equal(getFeePaymentState(0.3, 0.1 + 0.2), "PAID");
  assert.equal(getOutstandingBalance(0.3, 0.1 + 0.2), 0);
});

test("outstanding balance never goes negative", () => {
  assert.equal(getOutstandingBalance(1000, 400), 600);
  assert.equal(getOutstandingBalance(1000, 1500), 0);
});

test("invalid amounts are rejected", () => {
  assert.throws(() => getFeePaymentState(-1, 0));
  assert.throws(() => getFeePaymentState(100, Number.NaN));
  assert.throws(() => getOutstandingBalance(100, -5));
});

test("money helpers work in whole kobo", () => {
  assert.equal(toKobo("12.50"), 1250);
  assert.equal(toKobo({ toString: () => "7.25" }), 725);
  assert.equal(sumKobo(["0.10", "0.20"]), 30);
  assert.equal(fromKobo(1250), 12.5);
});
