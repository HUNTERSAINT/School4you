import test from "node:test";
import assert from "node:assert/strict";
import { isValidSubaccountCode, resolveSubaccount } from "./paystack.ts";

test("accepts well-formed subaccount codes", () => {
  assert.equal(isValidSubaccountCode("ACCT_abc123xyz"), true);
  assert.equal(isValidSubaccountCode("acct_abc123xyz"), false);
  assert.equal(isValidSubaccountCode("ACCT_1"), false);
});

test("blocks payments with no subaccount unless platform account allowed", () => {
  assert.equal(resolveSubaccount(null, false).ok, false);
  assert.deepEqual(resolveSubaccount(null, true), { ok: true, code: null });
  assert.deepEqual(resolveSubaccount("ACCT_abc123xyz", false), { ok: true, code: "ACCT_abc123xyz" });
});
