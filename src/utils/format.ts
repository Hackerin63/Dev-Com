import { CURRENCY_SYMBOL } from '@/constants/config';

export function formatPrice(value: number): string {
  const fixed = Number.isInteger(value) ? value.toString() : value.toFixed(2);
  const [whole, decimals] = fixed.split('.');
  const withCommas = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `${CURRENCY_SYMBOL}${withCommas}${decimals ? '.' + decimals : ''}`;
}

export function getDiscountedPrice(price: number, discountPercent: number): number {
  if (discountPercent <= 0) return price;
  return Math.round(price * (1 - discountPercent / 100) * 100) / 100;
}

export function formatDate(date: Date | null): string {
  if (!date) return '—';
  return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatDateTime(date: Date | null): string {
  if (!date) return '—';
  return `${formatDate(date)}, ${date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}`;
}

export function shortId(id: string): string {
  return id.slice(0, 6).toUpperCase();
}
