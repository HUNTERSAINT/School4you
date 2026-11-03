import { test } from "node:test";
import assert from "node:assert/strict";
import { dateInZone, dateOnlyToUtc, dayRange } from "./dates.ts";
import { defaultAcademicYear } from "./terms.ts";

test("today is calculated in the school's time zone, not UTC", () => {
  // 23:30 UTC on 3 Nov is already 00:30 on 4 Nov in Lagos (UTC+1).
  assert.equal(dateInZone("Africa/Lagos", new Date("2026-11-03T23:30:00Z")), "2026-11-04");
  assert.equal(dateInZone("UTC", new Date("2026-11-03T23:30:00Z")), "2026-11-03");
});

test("an invalid time zone falls back to Lagos", () => {
  assert.equal(dateInZone("Not/AZone", new Date("2026-11-03T23:30:00Z")), "2026-11-04");
});

test("day range spans exactly 24 hours from UTC midnight", () => {
  const { start, end } = dayRange("2026-11-03");
  assert.equal(start.toISOString(), "2026-11-03T00:00:00.000Z");
  assert.equal(end.getTime() - start.getTime(), 86_400_000);
  assert.equal(dateOnlyToUtc("2026-11-03").getTime(), start.getTime());
});

test("default academic year follows the September to July calendar", () => {
  assert.equal(defaultAcademicYear(new Date("2026-11-03T10:00:00Z")).name, "2026/2027");
  assert.equal(defaultAcademicYear(new Date("2027-03-01T10:00:00Z")).name, "2026/2027");
  assert.equal(defaultAcademicYear(new Date("2026-07-31T10:00:00Z")).name, "2025/2026");
  assert.equal(defaultAcademicYear(new Date("2026-08-01T10:00:00Z")).name, "2026/2027");
  const year = defaultAcademicYear(new Date("2026-11-03T10:00:00Z"));
  assert.equal(year.startsAt.toISOString().slice(0, 10), "2026-09-01");
  assert.equal(year.endsAt.toISOString().slice(0, 10), "2027-07-31");
});
