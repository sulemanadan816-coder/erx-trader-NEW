export function parseNumericPkr(val: string | number): number {
  if (typeof val === 'number') return Math.round(val);
  const digits = String(val).replace(/[^0-9.]/g, '');
  const parsed = Number(digits);
  return Number.isFinite(parsed) ? Math.round(parsed) : 0;
}
