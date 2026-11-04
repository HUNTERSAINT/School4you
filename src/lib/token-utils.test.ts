import test from "node:test";
import assert from "node:assert/strict";
import { hashToken, newRawToken, isTokenFormat } from "./token-utils.ts";

test("raw tokens are 64 hex chars and unique", () => {
  const a = newRawToken();
  assert.ok(isTokenFormat(a));
  assert.notEqual(a, newRawToken());
});

test("hashing is deterministic and differs from the raw token", () => {
  const raw = newRawToken();
  assert.equal(hashToken(raw), hashToken(raw));
  assert.notEqual(hashToken(raw), raw);
  assert.equal(isTokenFormat("nope"), false);
});
