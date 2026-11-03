export type GradeBand = { min: number; grade: string; remark: string };

export const DEFAULT_GRADE_BANDS: GradeBand[] = [
  { min: 80, grade: "A", remark: "Excellent" },
  { min: 70, grade: "B", remark: "Very good" },
  { min: 60, grade: "C", remark: "Good" },
  { min: 50, grade: "D", remark: "Credit" },
  { min: 40, grade: "E", remark: "Pass" },
  { min: 0, grade: "F", remark: "Needs improvement" },
];

export function calculateResult(
  caScore: number,
  examScore: number,
  maxCa = 30,
  maxExam = 70,
  bands: GradeBand[] = DEFAULT_GRADE_BANDS,
) {
  for (const [value, maximum, label] of [
    [caScore, maxCa, "CA"],
    [examScore, maxExam, "Exam"],
  ] as const) {
    if (!Number.isFinite(value) || value < 0 || value > maximum) {
      throw new Error(`${label} score must be between 0 and ${maximum}.`);
    }
  }

  const total = caScore + examScore;
  const band = [...bands].sort((a, b) => b.min - a.min).find((item) => total >= item.min);
  return { caScore, examScore, total, grade: band?.grade ?? "F", remark: band?.remark ?? "Needs improvement" };
}

export function calculateClassAverage(totals: number[]) {
  if (totals.length === 0) return 0;
  return totals.reduce((sum, score) => sum + score, 0) / totals.length;
}

export function calculatePosition(totals: number[], studentTotal: number) {
  return 1 + totals.filter((total) => total > studentTotal).length;
}
