import { calculateAP } from './ap-calculator';

describe('AP Calculator', () => {
  it('calculates AP=H for S=9, O=5, D=6', () => {
    expect(calculateAP(9, 5, 6)).toBe('H');
  });

  it('calculates AP=L for S=2, O=1, D=1', () => {
    expect(calculateAP(2, 1, 1)).toBe('L');
  });

  it('returns null for out of bounds inputs', () => {
    expect(calculateAP(11, 5, 6)).toBeNull();
    expect(calculateAP(9, -1, 6)).toBeNull();
    expect(calculateAP(9, 5, 12)).toBeNull();
  });

  it('returns null for missing inputs', () => {
    expect(calculateAP(null, 5, 6)).toBeNull();
    expect(calculateAP(9, undefined, 6)).toBeNull();
  });

  // Severity 9-10 boundaries
  it('handles Severity 9-10 boundaries', () => {
    expect(calculateAP(10, 2, 1)).toBe('H');
    expect(calculateAP(9, 1, 4)).toBe('H');
    expect(calculateAP(9, 1, 3)).toBe('M');
  });

  // Severity 7-8 boundaries
  it('handles Severity 7-8 boundaries', () => {
    expect(calculateAP(8, 5, 1)).toBe('H');
    expect(calculateAP(7, 3, 5)).toBe('H');
    expect(calculateAP(7, 3, 4)).toBe('M');
    expect(calculateAP(8, 2, 5)).toBe('M');
    expect(calculateAP(8, 2, 4)).toBe('L');
  });

  // Severity 4-6 boundaries
  it('handles Severity 4-6 boundaries', () => {
    expect(calculateAP(6, 7, 1)).toBe('H');
    expect(calculateAP(5, 5, 7)).toBe('H');
    expect(calculateAP(5, 5, 6)).toBe('M');
    expect(calculateAP(4, 3, 5)).toBe('M');
    expect(calculateAP(4, 3, 4)).toBe('L');
    expect(calculateAP(6, 2, 10)).toBe('L');
  });

  // Severity 1-3 boundaries
  it('handles Severity 1-3 boundaries', () => {
    expect(calculateAP(3, 10, 10)).toBe('L');
    expect(calculateAP(1, 1, 1)).toBe('L');
  });
});
