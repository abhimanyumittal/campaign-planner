export const overlap = <T>(a: readonly T[], b: readonly T[]): T[] => a.filter((x) => b.includes(x));
export const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));
export const round = (n: number, digits = 0) => Math.round(n * 10 ** digits) / 10 ** digits;

export function parseAgeRange(s: string): [number, number] | null {
  const m = s.match(/^(\d+)-(\d+)$/);
  return m ? [Number(m[1]), Number(m[2])] : null;
}

export const rangesOverlap = (a: [number, number], b: [number, number]) => a[0] <= b[1] && b[0] <= a[1];
