/**
 * Calculates the Action Priority (AP) based on Severity (S), Occurrence (O), and Detection (D)
 * according to the AIAG-VDA FMEA Handbook (2019) default lookup rules.
 * S, O, and D must be integers between 1 and 10.
 * If any value is missing or out of bounds, returns null.
 */
export function calculateAP(
  severity: number | null | undefined,
  occurrence: number | null | undefined,
  detection: number | null | undefined,
): 'H' | 'M' | 'L' | null {
  if (
    severity === null ||
    severity === undefined ||
    occurrence === null ||
    occurrence === undefined ||
    detection === null ||
    detection === undefined
  ) {
    return null;
  }

  const S = Math.floor(severity);
  const O = Math.floor(occurrence);
  const D = Math.floor(detection);

  if (S < 1 || S > 10 || O < 1 || O > 10 || D < 1 || D > 10) {
    return null;
  }

  // Severity 9-10
  if (S >= 9) {
    if (O >= 2) {
      return 'H';
    }
    // O === 1
    if (D >= 4) {
      return 'H';
    }
    return 'M';
  }

  // Severity 7-8
  if (S >= 7) {
    if (O >= 5) {
      return 'H';
    }
    if (O >= 3) {
      if (D >= 5) {
        return 'H';
      }
      return 'M';
    }
    // O <= 2
    if (D >= 5) {
      return 'M';
    }
    return 'L';
  }

  // Severity 4-6
  if (S >= 4) {
    if (O >= 7) {
      return 'H';
    }
    if (O >= 5) {
      if (D >= 7) {
        return 'H';
      }
      return 'M';
    }
    if (O >= 3) {
      if (D >= 5) {
        return 'M';
      }
      return 'L';
    }
    // O <= 2
    return 'L';
  }

  // Severity 1-3
  return 'L';
}
