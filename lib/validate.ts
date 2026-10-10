/**
 * Indian mobile number → "9876543210", or null if invalid.
 * Accepts spaces, dashes, a leading 0, or +91 / 91.
 */
export function normalizeMobile(input: string): string | null {
  let digits = input.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) digits = digits.slice(2);
  else if (digits.length === 11 && digits.startsWith("0")) digits = digits.slice(1);
  return /^[6-9]\d{9}$/.test(digits) ? digits : null;
}

export const MOBILE_ERROR = "Please enter a valid 10-digit mobile number.";
