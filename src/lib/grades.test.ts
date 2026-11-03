import { test } from "node:test";
import assert from "node:assert/strict";
import { calculateClassAverage, calculatePosition, calculateResult, gradeForPercentage } from "./grades.ts";

test("grades a standard 30/70 subject by percentage", () => {
  const result = calculateResult(25, 60);
  assert.equal(result.total, 85);
  assert.equal(result.percentage, 85);
  assert.equal(result.grade, "A");
});

test("a subject whose maximums do not total 100 is graded on percentage, not raw marks", () => {
  // 80 raw marks out of 200 is 40%, an E, even though 80 would be an A on a /100 scale.
  const result = calculateResult(40, 40, 100, 100);
  assert.equal(result.total, 80);
  assert.equal(result.percentage, 40);
  assert.equal(result.grade, "E");
});

test("supports a 40/60 split", () => {
  const result = calculateResult(30, 42, 40, 60);
  assert.equal(result.percentage, 72);
  assert.equal(result.grade, "B");
});

test("rejects scores above the subject maximum or below zero", () => {
  assert.throws(() => calculateResult(31, 10), /CA score must be between 0 and 30/);
  assert.throws(() => calculateResult(10, 71), /Exam score must be between 0 and 70/);
  assert.throws(() => calculateResult(-1, 10), /CA score/);
  assert.throws(() => calculateResult(Number.NaN, 10), /CA score/);
});

test("rejects non-positive subject maximums", () => {
  assert.throws(() => calculateResult(0, 0, 0, 70), /maximum scores/);
});

test("grade band boundaries", () => {
  assert.equal(gradeForPercentage(80).grade, "A");
  assert.equal(gradeForPercentage(79.99).grade, "B");
  assert.equal(gradeForPercentage(40).grade, "E");
  assert.equal(gradeForPercentage(39.99).grade, "F");
  assert.equal(gradeForPercentage(0).grade, "F");
});

test("class average handles empty and normal lists", () => {
  assert.equal(calculateClassAverage([]), 0);
  assert.equal(calculateClassAverage([60, 80]), 70);
});

test("equal scores share a position", () => {
  const scores = [80, 80, 70];
  assert.equal(calculatePosition(scores, 80), 1);
  assert.equal(calculatePosition(scores, 70), 3);
});

test("tiny floating point differences do not change a position", () => {
  assert.equal(calculatePosition([70.001, 70], 70), 1);
});
