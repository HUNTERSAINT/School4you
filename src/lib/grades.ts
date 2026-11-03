export type GradeBand = { min: number; grade: string; remark: string };

/** Bands are applied to the PERCENTAGE score, so subjects with any max total grade fairly. */
export const DEFAULT_GRADE_BANDS: GradeBand[] = [
  { min: 80, grade: "A", remark: "Excellent" },
  { min: 70, grade: "B", remark: "Very good" },
  { min: 60, grade: "C", remark: "Good" },
  { min: 50, grade: "D", remark: "Credit" },
  { min: 40, grade: "E", remark: "Pass" },
  { min: 0, grade: "F", remark: "Needs improvement" },
];

export const round2 = (value: number) => Math.round(value * 100) / 100;

export function gradeForPercentage(percentage: number, bands: GradeBand[] = DEFAULT_GRADE_BANDS) {
  const band = [...bands].sort((a, b) => b.min - a.min).find((item) => percentage >= item.min);
  return { grade: band?.grade ?? "F", remark: band?.remark ?? "Needs improvement" };
}

export function calculateResult(
  caScore: number,
  examScore: number,
  maxCa = 30,
  maxExam = 70,
  bands: GradeBand[] = DEFAULT_GRADE_BANDS,
) {
  if (!Number.isFinite(maxCa) || !Number.isFinite(maxExam) || maxCa <= 0 || maxExam <= 0) {
    throw new Error("Subject maximum scores must be positive numbers.");
  }
  for (const [value, maximum, label] of [
    [caScore, maxCa, "CA"],
    [examScore, maxExam, "Exam"],
  ] as const) {
    if (!Number.isFinite(value) || value < 0 || value > maximum) {
      throw new Error(`${label} score must be between 0 and ${maximum}.`);
    }
  }

  const total = round2(caScore + examScore);
  const maxTotal = maxCa + maxExam;
  const percentage = round2((total / maxTotal) * 100);
  const { grade, remark } = gradeForPercentage(percentage, bands);
  return { caScore, examScore, total, maxTotal, percentage, grade, remark };
}

export function calculateClassAverage(values: number[]) {
  if (values.length === 0) return 0;
  return values.reduce((sum, score) => sum + score, 0) / values.length;
}

/** Competition ranking: students on equal scores share a position. */
export function calculatePosition(values: number[], studentValue: number) {
  const own = round2(studentValue);
  return 1 + values.filter((value) => round2(value) > own).length;
}
