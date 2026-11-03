/**
 * Money helpers. Amounts are summed as whole kobo (integers) so that values such as
 * 0.1 + 0.2 never produce floating-point drift in balances or payment state.
 */
export type Numeric = number | string | { toString(): string };

export function toKobo(amount: Numeric): number {
  return Math.round(Number(amount) * 100);
}

export function fromKobo(kobo: number): number {
  return kobo / 100;
}

export function sumKobo(values: Iterable<Numeric>): number {
  let total = 0;
  for (const value of values) total += toKobo(value);
  return total;
}
