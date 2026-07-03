import { Router } from 'express';
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';
import { randomUUID } from 'node:crypto';
import { db, uid, seedEmptyWalletAndBusiness } from '../db.js';
import { signToken } from '../authUtil.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { ah } from '../asyncHandler.js';

const router = Router();

// Faqat haqiqiy parol taxmin qilish xavfi bo'lgan endpointlarga (register/login/google)
// qo'llanadi — /me kabi tokenli (allaqachon autentifikatsiyadan o'tgan) so'rovlarga emas,
// aks holda oddiy foydalanuvchi ilovada faol ishlaganida ham bloklanib qolishi mumkin edi.
const bruteForceLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Juda ko'p urinish qilindi, birozdan keyin qayta urinib ko'ring" },
});

function serializeUser(row) {
  const profiles = JSON.parse(row.profiles);
  return {
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    phone: row.phone || '',
    accountType: row.account_type,
    hasBoth: profiles.length >= 2,
    profiles,
    companyName: row.company_name || '',
    role: row.role,
  };
}

async function findByIdentifier(identifier) {
  const value = (identifier || '').trim().toLowerCase();
  return await db.prepare('SELECT * FROM users WHERE LOWER(email) = ? OR phone = ?').get(value, identifier?.trim());
}

router.post('/register', bruteForceLimiter, ah(async (req, res) => {
  const { accountType, email, phone, fullName, password, companyName } = req.body || {};
  const acc = accountType === 'business' ? 'business' : 'personal';

  if (!email || !fullName || !password) {
    return res.status(400).json({ message: "Barcha majburiy maydonlarni to'ldiring" });
  }
  if (password.length < 6) {
    return res.status(400).json({ message: "Parol kamida 6 ta belgidan iborat bo'lishi kerak" });
  }

  const existing = await db.prepare('SELECT id FROM users WHERE LOWER(email) = ?').get(email.trim().toLowerCase());
  if (existing) {
    return res.status(409).json({ message: 'Bu email bilan hisob allaqachon mavjud' });
  }

  const userId = uid('user');
  const passwordHash = bcrypt.hashSync(password, 10);
  await db.prepare(`INSERT INTO users (id, email, phone, password_hash, full_name, company_name, account_type, profiles, role, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .run(userId, email.trim().toLowerCase(), phone || '', passwordHash, fullName, acc === 'business' ? (companyName || '') : '', acc, JSON.stringify([acc]), 'user', new Date().toISOString());

  await seedEmptyWalletAndBusiness(userId, fullName, email.trim().toLowerCase());

  const row = await db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  res.json({ accessToken: signToken(userId), user: serializeUser(row) });
}));

router.post('/login', bruteForceLimiter, ah(async (req, res) => {
  const { identifier, password } = req.body || {};

  const row = await findByIdentifier(identifier);
  if (!row || !bcrypt.compareSync(password || '', row.password_hash)) {
    return res.status(401).json({ message: "Email/telefon yoki parol noto'g'ri" });
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
    await db.prepare(`INSERT INTO users (id, email, phone, password_hash, full_name, company_name, account_type, profiles, role, created_at)
      VALUES (?, ?, '', ?, ?, '', 'personal', ?, 'user', ?)`)
      .run(userId, email, passwordHash, profile.name || 'Google User', JSON.stringify(['personal']), new Date().toISOString());
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

router.patch('/me', requireAuth, ah(async (req, res) => {
  const { fullName, phone } = req.body || {};
  await db.prepare('UPDATE users SET full_name = COALESCE(?, full_name), phone = COALESCE(?, phone) WHERE id = ?')
    .run(fullName || null, phone ?? null, req.userId);
  const row = await db.prepare('SELECT * FROM users WHERE id = ?').get(req.userId);
  res.json({ user: serializeUser(row) });
}));

router.post('/change-password', requireAuth, bruteForceLimiter, ah(async (req, res) => {
  const { currentPassword, newPassword } = req.body || {};
  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({ message: "Parol kamida 6 ta belgidan iborat bo'lishi kerak" });
  }
  if (!bcrypt.compareSync(currentPassword || '', req.dbUser.password_hash)) {
    return res.status(400).json({ message: "Joriy parol noto'g'ri" });
  }
  await db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(bcrypt.hashSync(newPassword, 10), req.userId);
  res.json({ ok: true });
}));

export default router;
