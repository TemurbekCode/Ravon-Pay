// Eskiz.uz SMS integratsiyasi (https://notify.eskiz.uz) — O'zbekistonda eng
// keng tarqalgan SMS gateway. Kerakli .env qiymatlari: ESKIZ_EMAIL,
// ESKIZ_PASSWORD (Eskiz.uz'da ro'yxatdan o'tganda beriladi), ESKIZ_FROM (ixtiyoriy).
//
// ESLATMA: bu integratsiya Eskiz'ning umumiy hujjatlashtirilgan API shakliga
// mos yozilgan (email+parol -> Bearer token -> SMS yuborish), lekin haqiqiy
// hisobingiz bilan sinab ko'rilmagan — birinchi ishga tushirishda xato kodlari
// va aniq maydon nomlarini Eskiz hujjatiga qarab tekshiring.
function requireEnv(name) {
  const v = process.env[name];
  if (!v) throw new Error(`${name} sozlanmagan — Eskiz.uz'da ro'yxatdan o'tgach .env'ga qo'shing`);
  return v;
}

let cachedToken = null;

async function getToken() {
  if (cachedToken && cachedToken.expiresAt > Date.now()) return cachedToken.token;
  const email = requireEnv('ESKIZ_EMAIL');
  const password = requireEnv('ESKIZ_PASSWORD');
  const res = await fetch('https://notify.eskiz.uz/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error(`Eskiz.uz autentifikatsiyasi muvaffaqiyatsiz: HTTP ${res.status}`);
  const data = await res.json();
  const token = data?.data?.token;
  if (!token) throw new Error("Eskiz.uz javobida token topilmadi");
  cachedToken = { token, expiresAt: Date.now() + 25 * 24 * 60 * 60 * 1000 }; // Eskiz tokenlari ~30 kun amal qiladi
  return token;
}

export const EskizProvider = {
  name: 'eskiz',
  async send(phone, code) {
    const token = await getToken();
    const res = await fetch('https://notify.eskiz.uz/api/message/sms/send', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mobile_phone: phone.replace(/\D/g, ''),
        message: `RavonPay tasdiqlash kodi: ${code}`,
        from: process.env.ESKIZ_FROM || '4546',
      }),
    });
    if (!res.ok) throw new Error(`SMS yuborilmadi: HTTP ${res.status}`);
    return {};
  },
};
