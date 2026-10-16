const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const UPI_ID_RE = /^[A-Za-z0-9._-]{2,100}@[A-Za-z0-9.-]{2,100}$/;

export function validateEmail(value: string): string | null {
  if (!value.trim()) return 'Enter your email address.';
  if (!EMAIL_RE.test(value.trim())) return 'Enter a valid email address.';
  return null;
}

export function validatePassword(value: string): string | null {
  if (!value) return 'Enter a password.';
  if (value.length < 6) return 'Use at least 6 characters.';
  return null;
}

export function validateName(value: string): string | null {
  if (value.trim().length < 2) return 'Enter your full name.';
  return null;
}

export function validatePhone(value: string): string | null {
  const digits = value.replace(/\D/g, '');
  if (digits.length < 10 || digits.length > 15) return 'Enter a valid phone number (10-15 digits).';
  return null;
}

export function validateAddress(value: string): string | null {
  if (value.trim().length < 10) return 'Enter your full delivery address.';
  return null;
}

export function validateUpiId(value: string): string | null {
  if (!value.trim()) return null;
  if (!UPI_ID_RE.test(value.trim())) return 'Enter a valid UPI ID, such as name@bank.';
  return null;
}

export function validateUrl(value: string): string | null {
  if (!value.trim()) return null; // optional: a placeholder is shown when empty
  if (!/^https?:\/\/\S+$/i.test(value.trim())) return 'Use a link that starts with http:// or https://';
  return null;
}

export function parseNumber(value: string): number | null {
  const n = Number(value.replace(/,/g, '').trim());
  return value.trim() !== '' && Number.isFinite(n) ? n : null;
}
