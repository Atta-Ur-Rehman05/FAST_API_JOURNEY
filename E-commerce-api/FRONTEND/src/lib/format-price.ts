/**
 * Formats a monetary value coming from the backend (Python Decimal → JSON float)
 * into a consistent Rs. display string with exactly 2 decimal places.
 *
 * Backend stores all prices as Numeric(10,2) and serializes them as floats.
 * Using a single formatter prevents inconsistent rounding across components.
 */
export function formatPrice(value: number | string | unknown): string {
  const num = typeof value === 'number' ? value : Number(value);
  if (Number.isNaN(num)) return 'Rs. 0.00';
  return `Rs. ${num.toFixed(2)}`;
}
