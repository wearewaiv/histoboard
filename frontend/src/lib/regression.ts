/**
 * Statistical regression utilities for chart annotations.
 *
 * @module lib/regression
 */

/**
 * Compute ordinary least-squares linear regression for a set of (x, y) points.
 *
 * @param points - Array of {x, y} coordinate pairs (minimum 2 required)
 * @returns slope, intercept, and R-squared, or null if regression cannot be computed
 */
export function computeLinearRegression(
  points: { x: number; y: number }[],
): { slope: number; intercept: number; r2: number } | null {
  if (points.length < 2) return null;

  const n = points.length;
  const sumX = points.reduce((sum, p) => sum + p.x, 0);
  const sumY = points.reduce((sum, p) => sum + p.y, 0);
  const sumXY = points.reduce((sum, p) => sum + p.x * p.y, 0);
  const sumX2 = points.reduce((sum, p) => sum + p.x * p.x, 0);

  const denominator = n * sumX2 - sumX * sumX;
  if (denominator === 0) return null;

  const slope = (n * sumXY - sumX * sumY) / denominator;
  const intercept = (sumY - slope * sumX) / n;

  const meanY = sumY / n;
  const ssTotal = points.reduce(
    (sum, p) => sum + Math.pow(p.y - meanY, 2),
    0,
  );
  const ssResidual = points.reduce(
    (sum, p) => sum + Math.pow(p.y - (slope * p.x + intercept), 2),
    0,
  );
  const r2 = ssTotal === 0 ? 0 : 1 - ssResidual / ssTotal;

  return { slope, intercept, r2 };
}
