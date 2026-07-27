/** Small shared helpers. */

/**
 * Round to 2 decimals to avoid floating-point noise in money math.
 * (In production, prefer integer cents or a decimal library — worth saying out loud.)
 */
export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** crypto.randomUUID is available in Node 19+ and modern browsers. */
export function randomId(): string {
  return crypto.randomUUID();
}
