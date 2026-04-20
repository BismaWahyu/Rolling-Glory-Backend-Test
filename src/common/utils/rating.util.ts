/**
 * Round a rating to the nearest 0.5 step.
 * Examples: 3.2 → 3, 3.9 → 4, 3.6 → 3.5
 */
export const roundToHalfStar = (value: number): number => {
  if (!Number.isFinite(value)) return 0;
  return Math.round(value * 2) / 2;
};
