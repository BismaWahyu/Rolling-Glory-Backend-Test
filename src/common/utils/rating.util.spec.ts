import { roundToHalfStar } from './rating.util';

describe('roundToHalfStar', () => {
  it.each([
    [3.2, 3],
    [3.9, 4],
    [3.6, 3.5],
    [3.25, 3.5],
    [3.24, 3],
    [0, 0],
    [5, 5],
    [4.75, 5],
    [4.74, 4.5],
  ])('rounds %d to %d', (input, expected) => {
    expect(roundToHalfStar(input)).toBe(expected);
  });

  it('returns 0 for NaN or Infinity', () => {
    expect(roundToHalfStar(NaN)).toBe(0);
    expect(roundToHalfStar(Infinity)).toBe(0);
  });
});
