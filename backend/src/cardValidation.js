// cards.routes.js va business.routes.js (obuna to'lovi) uchun umumiy karta
// tekshiruvi — ikkalasida ham bir xil qoida ishlatilishi kerak.

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

// Uzcard/Humo O'zbekistonning yopiq milliy tizimlari — to'liq BIN (bank-prefiks)
// jadvali ochiq manbada yo'q. Shuning uchun 8600/9860 aniq tasdiqlangan, lekin
// Visa/Mastercard shakliga to'g'ri kelmaydigan boshqa 16 xonali raqamlar ham
// "Mahalliy karta" deb qabul qilinadi — aks holda boshqa bank chiqargan haqiqiy
// Uzcard/Humo kartasi asossiz rad etiladi.
function detectCardType(digits) {
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

function expiryValid(expiry) {
  const m = (expiry || '').match(/^(\d{2})\/(\d{2})$/);
  if (!m) return null;
  const month = parseInt(m[1], 10);
  const year = 2000 + parseInt(m[2], 10);
  if (month < 1 || month > 12) return null;
  if (new Date(year, month, 1) <= new Date()) return null;
  return `${m[1]}/${m[2]}`;
}

// Foydalanuvchi kiritgan haqiqiy karta ma'lumotlarini tekshiradi (Luhn/turi/muddat)
// va faqat MASKALANGAN raqamni qaytaradi. CVV bu yerda ishlatilmaydi/saqlanmaydi.
export function validateCard({ cardNumber, expiry, cardholderName }) {
  const digits = (cardNumber || '').replace(/\D/g, '');
  if (digits.length < 13 || digits.length > 16) {
    return { error: "Karta raqami noto'g'ri" };
  }
  const type = detectCardType(digits);
  if (!type) return { error: "Faqat Visa, Mastercard, Uzcard yoki Humo qo'llab-quvvatlanadi" };
  if (requiresLuhn(type) && !luhnValid(digits)) {
    return { error: "Karta raqami noto'g'ri" };
  }
  const validExpiry = expiryValid(expiry);
  if (!validExpiry) return { error: "Amal qilish muddati noto'g'ri yoki tugagan" };
  const holder = (cardholderName || '').trim();
  if (!holder) return { error: "Karta egasining ismini kiriting" };
  return {
    digits, type, expiry: validExpiry, holder,
    masked: `${digits.slice(0, 4)} •••• •••• ${digits.slice(-4)}`,
  };
}
