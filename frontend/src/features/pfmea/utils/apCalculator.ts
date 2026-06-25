/**
 * Client-side Action Priority (AP) calculator matching backend logic.
 * Default rules from AIAG-VDA FMEA Handbook (2019).
 */
export function calculateAP(
  severity: number | string | null | undefined,
  occurrence: number | string | null | undefined,
  detection: number | string | null | undefined,
): 'H' | 'M' | 'L' | null {
  if (severity === null || severity === undefined || severity === '' ||
      occurrence === null || occurrence === undefined || occurrence === '' ||
      detection === null || detection === undefined || detection === '') {
    return null;
  }

  const S = Math.floor(Number(severity));
  const O = Math.floor(Number(occurrence));
  const D = Math.floor(Number(detection));

  if (isNaN(S) || isNaN(O) || isNaN(D) || S < 1 || S > 10 || O < 1 || O > 10 || D < 1 || D > 10) {
    return null;
  }

  // Severity 9-10
  if (S >= 9) {
    if (O >= 2) return 'H';
    if (D >= 4) return 'H';
    return 'M';
  }

  // Severity 7-8
  if (S >= 7) {
    if (O >= 5) return 'H';
    if (O >= 3) {
      if (D >= 5) return 'H';
      return 'M';
    }
    if (D >= 5) return 'M';
    return 'L';
  }

  // Severity 4-6
  if (S >= 4) {
    if (O >= 7) return 'H';
    if (O >= 5) {
      if (D >= 7) return 'H';
      return 'M';
    }
    if (O >= 3) {
      if (D >= 5) return 'M';
      return 'L';
    }
    return 'L';
  }

  // Severity 1-3
  return 'L';
}
