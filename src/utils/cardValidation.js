// Karta raqami/muddat formatlash va tekshirish — CardForm.jsx (UI) va mockStore.js
// (offline zaxira) uchun umumiy, shuning uchun shared/ emas, utils/ ichida.

export function formatCardNumber(v) {
  const digits = v.replace(/\D/g, '').slice(0, 16);
  return digits.replace(/(.{4})/g, '$1 ').trim();
}

export function formatExpiry(v) {
  const digits = v.replace(/\D/g, '').slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

// Uzcard/Humo O'zbekistonning yopiq milliy tizimlari — ularning to'liq BIN
// (bank-prefiks) jadvali hech qanday ochiq manbada yo'q (har bir bank o'zining
// prefiksi bilan chiqarishi mumkin). Shuning uchun 8600/9860 — aniq tasdiqlangan,
// eng keng tarqalgan prefikslar — lekin Visa/Mastercard shakliga to'g'ri
// kelmaydigan boshqa 16 xonali raqamlar ham "Mahalliy karta" deb qabul qilinadi,
// aks holda haqiqiy mijozning (masalan boshqa bank chiqargan Uzcard) kartasi
// asossiz rad etiladi.
export function detectCardType(cardNumber) {
  const digits = (cardNumber || '').replace(/\D/g, '');
  if (digits.startsWith('8600')) return 'Uzcard';
  if (digits.startsWith('9860')) return 'Humo';
  if (digits.startsWith('4')) return 'Visa';
  if (/^5[1-5]/.test(digits)) return 'Mastercard';
  if (digits.length === 16) return 'Mahalliy karta';
  return null;
}

// O'zbekiston ichki karta tizimlari (Uzcard/Humo/boshqa mahalliy) Luhn
// checksum'ga rioya qilishi shart emas — faqat Visa/Mastercard uchun talab qilinadi.
function requiresLuhn(type) {
  return type === 'Visa' || type === 'Mastercard';
}

function luhnValid(digits) {
  let sum = 0;
  let alt = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let n = parseInt(digits[i], 10);
    if (alt) { n *= 2; if (n > 9) n -= 9; }
    sum += n;
    alt = !alt;
  }
  return sum % 10 === 0;
}

export function isExpiryValid(expiry) {
  const m = (expiry || '').match(/^(\d{2})\/(\d{2})$/);
  if (!m) return false;
  const month = parseInt(m[1], 10);
  const year = 2000 + parseInt(m[2], 10);
  if (month < 1 || month > 12) return false;
  const expiresAt = new Date(year, month, 1); // muddat oyning oxirigacha amal qiladi
  return expiresAt > new Date();
}

export function isCardNumberValid(cardNumber) {
  const digits = (cardNumber || '').replace(/\D/g, '');
  const type = detectCardType(cardNumber);
  return digits.length >= 13 && digits.length <= 16 && !!type && (!requiresLuhn(type) || luhnValid(digits));
}

export function isCvvValid(cvv) {
  return (cvv || '').length === 3;
}

export function isHolderValid(cardholderName) {
  return (cardholderName || '').trim().length > 1;
}

// CardPicker uchun: mavjud kartani tanlagan bo'lsa darhol yaroqli, "yangi karta"
// tanlangan (yoki umuman kartasi yo'q) bo'lsa forma to'liq va to'g'ri to'ldirilishi kerak.
export function isCardPickerValid(selected, cardForm) {
  return selected && selected !== 'new' ? true : isCardFormValid(cardForm);
}

export function isCardFormValid(value) {
  return (
    isCardNumberValid(value.cardNumber)
    && isExpiryValid(value.expiry)
    && isCvvValid(value.cvv)
    && isHolderValid(value.cardholderName)
  );
}
