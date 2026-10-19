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

// Compare executable frontend/backend implementations, not a copied test lookup.
// Agreement does not establish conformance with a licensed rating table.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Script } from 'node:vm';
import { ModuleKind, transpileModule } from 'typescript';

const clientSource = readFileSync(resolve(__dirname, '../../../../frontend/src/features/pfmea/utils/apCalculator.ts'), 'utf8');
const clientModule: { calculateAP?: (...ratings: any[]) => string | null } = {};
new Script(transpileModule(clientSource, { compilerOptions: { module: ModuleKind.CommonJS } }).outputText)
  .runInNewContext({ exports: clientModule });
const clientAP = clientModule.calculateAP!;

describe('configured AP profile parity', () => {
  it('matches all 1,000 integer combinations', () => {
    let combinations = 0;
    for (let s = 1; s <= 10; s++) for (let o = 1; o <= 10; o++) for (let d = 1; d <= 10; d++) {
      expect(clientAP(s, o, d)).toBe(calculateAP(s, o, d));
      combinations++;
    }
    expect(combinations).toBe(1000);
  });
  it('accepts integer form strings on the client', () => {
    expect(clientAP('9', '5', '6')).toBe(calculateAP(9, 5, 6));
  });
  it('rejects fractional, nonfinite, and missing values in every position', () => {
    for (const value of [1.5, 9.9, NaN, Infinity, -Infinity, null, undefined, 0, 11]) {
      expect(calculateAP(value, 5, 6)).toBeNull();
      expect(calculateAP(9, value, 6)).toBeNull();
      expect(calculateAP(9, 5, value)).toBeNull();
      expect(clientAP(value, 5, 6)).toBeNull();
      expect(clientAP(9, value, 6)).toBeNull();
      expect(clientAP(9, 5, value)).toBeNull();
    }
    for (const value of ['', ' ', '1.5', 'bad', '0x2']) expect(clientAP(value, 5, 6)).toBeNull();
  });
});
