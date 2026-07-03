// Payoneer White-label Partner API integratsiyasi uchun skelet.
//
// MUHIM: Payoneer'ning aniq endpoint'lari (payout yaratish, balans so'rash va h.k.)
// FAQAT hamkorlik (partnership) tasdiqlangandan keyin ochiladigan developer
// portalida beriladi (https://www.payoneer.com/integration-partnerships/).
// Shuning uchun bu yerda faqat OAuth2 client-credentials oqimi (standart, keng
// tarqalgan) to'g'ri yozilgan — real endpoint manzillari va so'rov shakllari
// hamkorlik tasdiqlangach, Payoneer bergan hujjatga qarab TO'LDIRILISHI kerak.
//
// Kerakli .env qiymatlari: PAYONEER_CLIENT_ID, PAYONEER_CLIENT_SECRET, PAYONEER_PROGRAM_ID.

function requireEnv(name) {
  const v = process.env[name];
  if (!v) throw new Error(`${name} sozlanmagan — Payoneer hamkorligi tasdiqlangach .env'ga qo'shing`);
  return v;
}

let cachedToken = null; // { accessToken, expiresAt }

async function getAccessToken() {
  if (cachedToken && cachedToken.expiresAt > Date.now()) return cachedToken.accessToken;
  const clientId = requireEnv('PAYONEER_CLIENT_ID');
  const clientSecret = requireEnv('PAYONEER_CLIENT_SECRET');

  // ESLATMA: haqiqiy token endpoint manzili Payoneer partner hujjatida beriladi.
  const res = await fetch('https://login.payoneer.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'client_credentials', client_id: clientId, client_secret: clientSecret }),
  });
  if (!res.ok) throw new Error(`Payoneer token so'rovi muvaffaqiyatsiz: HTTP ${res.status}`);
  const data = await res.json();
  cachedToken = { accessToken: data.access_token, expiresAt: Date.now() + (data.expires_in || 3600) * 1000 - 5000 };
  return cachedToken.accessToken;
}

export const PayoneerProvider = {
  name: 'payoneer',

  async createTopUpCheckout() {
    throw new Error('Payoneer RavonPay hamyonini to\'ldirish uchun emas — u xalqaro daromadni (frilanser/dropshipping) qabul qilish va chiqarish uchun ishlatiladi.');
  },

  // Foydalanuvchining Payoneer hisobidan uning mahalliy kartasiga/hisobiga pul chiqarish.
  async createPayout({ amount, payeeId, currency = 'USD' }) {
    const programId = requireEnv('PAYONEER_PROGRAM_ID');
    const token = await getAccessToken();
    // ESLATMA: aniq endpoint yo'li (masalan /v4/programs/{id}/payees/{payeeId}/payouts)
    // Payoneer partner hujjatidan tasdiqlanishi kerak — bu joy PLACEHOLDER.
    const res = await fetch(`https://api.payoneer.com/v4/programs/${programId}/payees/${payeeId}/payouts`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount, currency, description: 'RavonPay payout' }),
    });
    if (!res.ok) throw new Error(`Payoneer payout so'rovi muvaffaqiyatsiz: HTTP ${res.status}`);
    return res.json();
  },
};
