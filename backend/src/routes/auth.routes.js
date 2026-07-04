import { Router } from 'express';
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';
import { randomUUID } from 'node:crypto';
import { db, uid, seedEmptyWalletAndBusiness } from '../db.js';
import { signToken } from '../authUtil.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { getSmsProvider } from '../sms/SmsProvider.js';
import { ah } from '../asyncHandler.js';

const router = Router();

// Faqat haqiqiy parol/kod taxmin qilish xavfi bo'lgan endpointlarga (otp
// so'rash/tekshirish, google) qo'llanadi — /me kabi tokenli (allaqachon
// autentifikatsiyadan o'tgan) so'rovlarga emas.
const bruteForceLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Juda ko'p urinish qilindi, birozdan keyin qayta urinib ko'ring" },
});

const OTP_TTL_MS = 5 * 60 * 1000;
const MAX_OTP_ATTEMPTS = 5;

function serializeUser(row) {
  const profiles = JSON.parse(row.profiles);
  return {
    id: row.id,
    fullName: row.full_name,
    email: row.email || '',
    phone: row.phone || '',
    accountType: row.account_type,
    hasBoth: profiles.length >= 2,
    profiles,
    companyName: row.company_name || '',
    role: row.role,
  };
}

function generateOtpCode() {
  return String(Math.floor(1000 + Math.random() * 9000));
}

// Ro'yxatdan o'tish/kirish uchun SMS kod so'raydi. `mode: 'register'` bo'lsa
// telefon allaqachon band bo'lsa xato qaytaradi, `mode: 'login'` bo'lsa
// aksincha (hisob topilmasa xato). Haqiqiy Eskiz kaliti sozlanmagan bo'lsa,
// kod javobda `devCode` sifatida qaytariladi (demo rejimi).
router.post('/otp/request', bruteForceLimiter, ah(async (req, res) => {
  const { phone, mode } = req.body || {};
  const cleanPhone = (phone || '').replace(/\D/g, '');
  if (cleanPhone.length < 9) return res.status(400).json({ message: "Telefon raqami noto'g'ri" });

  const existing = await db.prepare('SELECT id FROM users WHERE phone = ?').get(cleanPhone);
  if (mode === 'register' && existing) {
    return res.status(409).json({ message: 'Bu telefon raqami bilan hisob allaqachon mavjud, kiring' });
  }
  if (mode === 'login' && !existing) {
    return res.status(404).json({ message: "Bu telefon raqami bilan hisob topilmadi, ro'yxatdan o'ting" });
  }

  const code = generateOtpCode();
  await db.prepare('INSERT OR REPLACE INTO otp_codes (phone, code, expires_at, attempts) VALUES (?, ?, ?, 0)')
    .run(cleanPhone, code, Date.now() + OTP_TTL_MS);

  const provider = getSmsProvider();
  const result = await provider.send(cleanPhone, code);
  res.json({ sent: true, devCode: result.devCode });
}));

// Kodni tekshiradi. `mode: 'register'` va hisob hali yo'q bo'lsa — shu yerda
// yaratiladi (fullName/accountType/companyName shu so'rovda kelishi kerak).
// Aks holda mavjud hisobga kiritiladi.
router.post('/otp/verify', bruteForceLimiter, ah(async (req, res) => {
  const { phone, code, mode, fullName, accountType, companyName } = req.body || {};
  const cleanPhone = (phone || '').replace(/\D/g, '');

  const otp = await db.prepare('SELECT * FROM otp_codes WHERE phone = ?').get(cleanPhone);
  if (!otp || otp.expires_at < Date.now()) {
    return res.status(400).json({ message: "Kod muddati tugagan, qaytadan so'rang" });
  }
  if (otp.attempts >= MAX_OTP_ATTEMPTS) {
    return res.status(400).json({ message: "Juda ko'p noto'g'ri urinish, qaytadan kod so'rang" });
  }
  if (otp.code !== (code || '').trim()) {
    await db.prepare('UPDATE otp_codes SET attempts = attempts + 1 WHERE phone = ?').run(cleanPhone);
    return res.status(400).json({ message: "Kod noto'g'ri" });
  }
  await db.prepare('DELETE FROM otp_codes WHERE phone = ?').run(cleanPhone);

  let row = await db.prepare('SELECT * FROM users WHERE phone = ?').get(cleanPhone);
  if (!row) {
    if (mode !== 'register' || !fullName) {
      return res.status(404).json({ message: "Bu telefon raqami bilan hisob topilmadi" });
    }
    const acc = accountType === 'business' ? 'business' : 'personal';
    const userId = uid('user');
    await db.prepare(`INSERT INTO users (id, phone, full_name, company_name, account_type, profiles, role, created_at)
      VALUES (?, ?, ?, ?, ?, ?, 'user', ?)`)
      .run(userId, cleanPhone, fullName, acc === 'business' ? (companyName || '') : '', acc, JSON.stringify([acc]), new Date().toISOString());
    await seedEmptyWalletAndBusiness(userId, fullName, '');
    row = await db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  }

  res.json({ accessToken: signToken(row.id), user: serializeUser(row) });
}));

// Google orqali kirish — frontend'dan kelgan OAuth2 accessToken'ni to'g'ridan-to'g'ri
// Google'ning userinfo endpoint'iga yuborib tekshiradi (google-auth-library kabi qo'shimcha
// bog'liqlik shart emas). Email allaqachon mavjud bo'lsa shu hisobga kiradi, aks holda
// yangi (parolsiz — tasodifiy xesh bilan) hisob yaratadi.
router.post('/google', bruteForceLimiter, ah(async (req, res) => {
  const { accessToken } = req.body || {};
  if (!accessToken) return res.status(400).json({ message: 'accessToken talab qilinadi' });

  let profile;
  try {
    const profileRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!profileRes.ok) return res.status(401).json({ message: 'Google tokeni yaroqsiz' });
    profile = await profileRes.json();
  } catch {
    return res.status(502).json({ message: "Google bilan bog'lanib bo'lmadi" });
  }

  if (!profile?.email || profile.email_verified === false) {
    return res.status(401).json({ message: "Google email tasdiqlanmagan" });
  }

  const email = profile.email.trim().toLowerCase();
  let row = await db.prepare('SELECT * FROM users WHERE LOWER(email) = ?').get(email);
  if (!row) {
    const userId = uid('user');
    const passwordHash = bcrypt.hashSync(randomUUID(), 10);
    // Google orqali ro'yxatdan o'tganda ham telefon ustuni unique/NOT NULL —
    // haqiqiy telefon berilmagani uchun o'ziga xos vaqtinchalik qiymat qo'yiladi,
    // foydalanuvchi keyin Sozlamalar orqali haqiqiy raqamini kiritishi mumkin.
    const placeholderPhone = `google-${userId}`;
    await db.prepare(`INSERT INTO users (id, email, phone, password_hash, full_name, company_name, account_type, profiles, role, created_at)
      VALUES (?, ?, ?, ?, ?, '', 'personal', ?, 'user', ?)`)
      .run(userId, email, placeholderPhone, passwordHash, profile.name || 'Google User', JSON.stringify(['personal']), new Date().toISOString());
    await seedEmptyWalletAndBusiness(userId, profile.name || 'Google User', email);
    row = await db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  }
  res.json({ accessToken: signToken(row.id), user: serializeUser(row) });
}));

router.get('/me', requireAuth, ah(async (req, res) => {
  res.json({ user: serializeUser(req.dbUser) });
}));

router.post('/logout', requireAuth, ah(async (_req, res) => {
  res.json({ ok: true });
}));

router.post('/switch-profile', requireAuth, ah(async (req, res) => {
  const { accountType } = req.body || {};
  const profiles = JSON.parse(req.dbUser.profiles);
  if (!profiles.includes(accountType)) {
    return res.status(400).json({ message: 'Bu profil turi hali faollashtirilmagan' });
  }
  await db.prepare('UPDATE users SET account_type = ? WHERE id = ?').run(accountType, req.userId);
  const row = await db.prepare('SELECT * FROM users WHERE id = ?').get(req.userId);
  res.json({ user: serializeUser(row) });
}));

router.post('/activate-profile', requireAuth, ah(async (req, res) => {
  const { accountType, companyName } = req.body || {};
  if (accountType !== 'personal' && accountType !== 'business') {
    return res.status(400).json({ message: "Noto'g'ri hisob turi" });
  }
  const profiles = Array.from(new Set([...JSON.parse(req.dbUser.profiles), accountType]));
  const nextCompanyName = accountType === 'business' ? (companyName || req.dbUser.company_name || '') : req.dbUser.company_name;
  await db.prepare('UPDATE users SET profiles = ?, account_type = ?, company_name = ? WHERE id = ?')
    .run(JSON.stringify(profiles), accountType, nextCompanyName, req.userId);
  const row = await db.prepare('SELECT * FROM users WHERE id = ?').get(req.userId);
  res.json({ user: serializeUser(row) });
}));

// fullName/phone'dan tashqari email ham shu yerdan qo'shiladi/o'zgartiriladi/
// o'chiriladi (birinchi kirishdagi ixtiyoriy taklif yoki Sozlamalar orqali).
// `email` maydoni so'rovda umuman bo'lmasa — mavjud qiymat saqlanadi; bo'sh
// qator sifatida yuborilsa — o'chiriladi; qiymat bilan yuborilsa — yangilanadi.
router.patch('/me', requireAuth, ah(async (req, res) => {
  const body = req.body || {};
  const { fullName, phone } = body;
  let email = req.dbUser.email;
  if ('email' in body) {
    const trimmed = (body.email || '').trim().toLowerCase();
    if (trimmed) {
      const existing = await db.prepare('SELECT id FROM users WHERE LOWER(email) = ? AND id != ?').get(trimmed, req.userId);
      if (existing) return res.status(409).json({ message: 'Bu email boshqa hisobda ishlatilmoqda' });
    }
    email = trimmed || null;
  }
  await db.prepare('UPDATE users SET full_name = COALESCE(?, full_name), phone = COALESCE(?, phone), email = ? WHERE id = ?')
    .run(fullName || null, phone ?? null, email, req.userId);
  const row = await db.prepare('SELECT * FROM users WHERE id = ?').get(req.userId);
  res.json({ user: serializeUser(row) });
}));

export default router;
