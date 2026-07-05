export const API = 'http://localhost:4000/api/v1';

export function randomPhone() {
  return `9${Date.now().toString().slice(-8)}${Math.floor(Math.random() * 10)}`;
}

// webServer sog'liq tekshiruvi (GET /health) muvaffaqiyatli javob bergandan
// keyin ham, node event loop hali to'liq tinchimagan bo'lishi mumkin — birinchi
// haqiqiy so'rov juda kam hollarda ECONNRESET bilan tugaydi (sof vaqt poygasi,
// mantiqiy xato emas). Shuning uchun tarmoq darajasidagi xato bo'lsa bir marta
// qayta urinadi.
async function fetchWithRetry(url, options, retries = 2) {
  try {
    return await fetch(url, options);
  } catch (err) {
    if (retries <= 0) throw err;
    await new Promise((r) => setTimeout(r, 500));
    return fetchWithRetry(url, options, retries - 1);
  }
}

function extractCode(texts) {
  for (const t of texts) {
    const m = t.match(/\d{4}/);
    if (m) return m[0];
  }
  return null;
}

// Ro'yxatdan o'tish oqimida OTP qadamini bosib o'tadi (dev-kod banneridan
// o'qiydi) va undan keyingi "email qo'shish" qadamini o'tkazib yuboradi.
export async function verifyOtpAndSkipEmail(page) {
  await page.waitForTimeout(800);
  const texts = await page.locator('.auth-error').allTextContents();
  const code = extractCode(texts) || '1234';
  await page.locator('input[type="text"]').last().fill(code);
  await page.click('button[type="submit"]');
  await page.waitForTimeout(800);
  const skipEmail = page.locator('.btn-skip');
  if (await skipEmail.count()) {
    await skipEmail.click();
    await page.waitForTimeout(500);
  }
}

// Shaxsiy hisobni to'liq ro'yxatdan o'tkazadi: turi tanlash -> forma -> OTP ->
// email o'tkazib yuborish -> karta o'tkazib yuborish -> /dashboard.
export async function registerPersonal(page, { fullName = 'Test User', phone } = {}) {
  const p = phone || randomPhone();
  await page.goto('/register', { waitUntil: 'networkidle' });
  await page.click('button.btn-submit');
  await page.waitForTimeout(300);
  await page.locator('input[type="text"]').first().fill(fullName);
  await page.locator('input[type="tel"]').first().fill(p);
  await page.locator('label.checkbox').first().click();
  await page.click('button[type="submit"]');
  await verifyOtpAndSkipEmail(page);
  await page.click('.btn-skip');
  await page.waitForTimeout(1000);
  return p;
}

// Mavjud (allaqachon ro'yxatdan o'tgan) hisobga /login orqali kiradi — "Kirish"
// oqimi haqiqatan HAM XUDDI O'SHA hisobga kiritayotganini tekshirish uchun
// (registerPersonal bilan chalkashtirmaslik kerak — bu boshqa route/forma).
export async function loginPersonal(page, phone) {
  await page.goto('/login', { waitUntil: 'networkidle' });
  await page.locator('input[type="tel"]').fill(phone);
  await page.click('button[type="submit"]');
  await verifyOtpAndSkipEmail(page);
  await page.waitForTimeout(1000);
}

// Biznes hisobni ro'yxatdan o'tkazadi va (agar mandatory bo'lsa) test kartasi
// bilan obunani ham faollashtiradi -> /business.
export async function registerBusiness(page, { companyName = 'Test Co', ownerName = 'Test Owner', phone, visaSub = true } = {}) {
  const p = phone || randomPhone();
  await page.goto('/register', { waitUntil: 'networkidle' });
  await page.click('.type-card.business');
  await page.click('button.btn-submit');
  await page.waitForTimeout(300);
  await page.locator('input[type="text"]').first().fill(companyName);
  await page.locator('input[type="text"]').nth(1).fill(ownerName);
  await page.locator('input[type="tel"]').first().fill(p);
  await page.locator('label.checkbox').first().click();
  await page.click('button[type="submit"]');
  await verifyOtpAndSkipEmail(page);
  await page.click('.btn-skip');
  await page.waitForTimeout(1000);
  if (visaSub) {
    const subInputs = page.locator('.pro-modal .cardform input');
    if (await subInputs.count()) {
      await subInputs.nth(0).fill('4111111111111111');
      await subInputs.nth(1).fill('12/29');
      await subInputs.nth(2).fill('321');
      await subInputs.nth(3).fill(ownerName);
      await page.waitForTimeout(200);
      await page.click('.pro-modal button.btn-new');
      await page.waitForTimeout(1500);
    }
  }
  return p;
}

// Backend'dagi OTP orqali to'g'ridan-to'g'ri hisob yaratadi (browser'siz) —
// admin/xavfsizlik testlarida UI orqali qayta-qayta ro'yxatdan o'tishni
// oldini oladi.
export async function apiRegister({ phone, fullName = 'API User', accountType = 'personal', companyName = '' } = {}) {
  const p = phone || randomPhone();
  const reqRes = await fetchWithRetry(`${API}/auth/otp/request`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: p, mode: 'register' }),
  }).then((r) => r.json());
  const verifyRes = await fetch(`${API}/auth/otp/verify`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: p, code: reqRes.devCode, mode: 'register', fullName, accountType, companyName }),
  }).then((r) => r.json());
  return { phone: p, token: verifyRes.accessToken, user: verifyRes.user };
}

// Biznes hisobni obunaga API orqali o'tkazadi (haqiqiy test kartasi bilan) —
// business/* routelarining aksariyati requireSubscription orqasida turadi.
export async function apiSubscribe(token, plan = 'monthly') {
  return fetch(`${API}/business/subscribe`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ plan, cardNumber: '4111111111111111', expiry: '12/29', cardholderName: 'Test Owner' }),
  }).then((r) => r.json());
}

// Backend'ning bittagina fayl (backend/data/ravonpay.db) yoki Turso'ga to'g'ridan-to'g'ri
// ulanadi — vaqtga bog'liq holatlarni (masalan "oy boshi" baseline) haqiqiy vaqtni
// kutmasdan sinash uchun kerak bo'lganda ishlatiladi.
async function dbClient() {
  const { createClient } = await import('@libsql/client');
  const path = await import('node:path');
  const { fileURLToPath } = await import('node:url');
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  return createClient({
    url: process.env.TURSO_DATABASE_URL || `file:${path.join(__dirname, '..', 'backend', 'data', 'ravonpay.db')}`,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });
}

// ravonpay@gmail.com UNIQUE bo'lgani uchun avvalgi test yugurishidan qolgan
// egalikni birinchi tozalab, keyin shu hisobga ko'chiradi — ikkalasi ATAYLAB
// BITTA funksiyada, ketma-ketlikni kafolatlash uchun (alohida global-setup
// jarayoni webServer bilan poyga holatiga tushib qolishi mumkin edi).
// Muvaffaqiyatsiz bo'lsa jim qolmaydi — sinovlar tushunarsiz "role: user"
// xatosi bilan emas, aniq sababi bilan to'xtaydi.
export async function becomeFounder(token) {
  const client = await dbClient();
  await client.execute("UPDATE users SET email = NULL, role = 'user' WHERE LOWER(email) = 'ravonpay@gmail.com'");
  client.close();

  const res = await fetch(`${API}/auth/me`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ email: 'ravonpay@gmail.com' }),
  });
  if (!res.ok) throw new Error(`becomeFounder: PATCH /auth/me failed with ${res.status}: ${await res.text()}`);
}

// Haqiqiy vaqtni (oy o'tishini) kutmasdan "bu oy boshidagi balans"ni sun'iy
// ravishda o'rnatadi — shu orqali balans-o'zgarish %'i haqiqatan bazadan
// hisoblanayotganini (qattiq yozilgan qiymat emasligini) tekshirish mumkin.
export async function setWalletBaseline(phone, balance, month) {
  const client = await dbClient();
  await client.execute({
    sql: 'UPDATE wallets SET baseline_balance = ?, baseline_month = ? WHERE user_id = (SELECT id FROM users WHERE phone = ?)',
    args: [balance, month, phone],
  });
  client.close();
}
