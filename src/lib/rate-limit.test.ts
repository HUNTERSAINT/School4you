import { beforeEach, test } from "node:test";
import assert from "node:assert/strict";
import { clearRateLimit, clientIp, rateLimit, resetRateLimits } from "./rate-limit.ts";

beforeEach(() => resetRateLimits());

test("allows up to the limit then blocks with a retry time", () => {
  const start = 1_000_000;
  for (let i = 0; i < 3; i++) assert.equal(rateLimit("k", 3, 60_000, start + i).ok, true);
  const blocked = rateLimit("k", 3, 60_000, start + 10);
  assert.equal(blocked.ok, false);
  assert.ok(blocked.retryAfter >= 1 && blocked.retryAfter <= 60);
});

test("the window resets after it expires", () => {
  const start = 2_000_000;
  rateLimit("k", 1, 1_000, start);
  assert.equal(rateLimit("k", 1, 1_000, start + 10).ok, false);
  assert.equal(rateLimit("k", 1, 1_000, start + 1_500).ok, true);
});

test("keys are independent and can be cleared", () => {
  const now = 3_000_000;
  rateLimit("a", 1, 60_000, now);
  assert.equal(rateLimit("a", 1, 60_000, now + 1).ok, false);
  assert.equal(rateLimit("b", 1, 60_000, now + 1).ok, true);
  clearRateLimit("a");
  assert.equal(rateLimit("a", 1, 60_000, now + 2).ok, true);
});

test("client IP prefers the first forwarded address", () => {
  assert.equal(clientIp(new Headers({ "x-forwarded-for": "203.0.113.9, 10.0.0.1" })), "203.0.113.9");
  assert.equal(clientIp(new Headers({ "x-real-ip": "198.51.100.4" })), "198.51.100.4");
  assert.equal(clientIp(new Headers()), "unknown");
});
