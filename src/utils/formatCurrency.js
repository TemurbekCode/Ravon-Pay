import { USD_RATE } from './constants.js';

// 12480000 -> "12 480 000"
export function formatCurrency(amount, currency = '') {
  if (amount == null || isNaN(amount)) return '0';
  const formatted = new Intl.NumberFormat('ru-RU').format(Math.abs(amount));
  const sign = amount < 0 ? '−' : '';
  return currency ? `${sign}${formatted} ${currency}` : `${sign}${formatted}`;
}

// UZS -> USD
export function uzsToUsd(uzs, rate = USD_RATE) {
  return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(uzs / rate);
}

// "Aziz Karimov" -> "AK"
export function getInitials(name = '') {
  return name.split(' ').map((w) => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();
}
