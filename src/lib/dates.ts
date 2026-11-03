const DAY_MS = 86_400_000;

/** Today's calendar date (YYYY-MM-DD) in the given IANA time zone. */
export function dateInZone(timeZone: string, now: Date = new Date()): string {
  const format = (zone: string) =>
    new Intl.DateTimeFormat("en-CA", { timeZone: zone, year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
  try {
    return format(timeZone);
  } catch {
    return format("Africa/Lagos");
  }
}

/** Attendance and term dates are stored as UTC midnight of the calendar date. */
export function dateOnlyToUtc(date: string): Date {
  return new Date(`${date}T00:00:00.000Z`);
}

export function dayRange(date: string): { start: Date; end: Date } {
  const start = dateOnlyToUtc(date);
  return { start, end: new Date(start.getTime() + DAY_MS) };
}
