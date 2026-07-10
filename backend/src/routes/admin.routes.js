import { Router } from 'express';
import path from 'node:path';
import { db } from '../db.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { requireAdmin } from '../middleware/requireAdmin.js';
import { addNotification, rowToWalletTx, rowToBizTx } from '../helpers.js';
import { UPLOADS_DIR } from '../uploadConfig.js';
import { ah } from '../asyncHandler.js';

const router = Router();
router.use(requireAuth, requireAdmin);

router.get('/overview', ah(async (req, res) => {
  const totalUsers = await db.prepare('SELECT COUNT(*) AS c FROM users').get();
  const personal = await db.prepare("SELECT COUNT(*) AS c FROM users WHERE account_type = 'personal'").get();
  const business = await db.prepare("SELECT COUNT(*) AS c FROM users WHERE account_type = 'business'").get();
  const pending = await db.prepare("SELECT COUNT(*) AS c FROM businesses WHERE verification_status = 'pending'").get();
  const verified = await db.prepare("SELECT COUNT(*) AS c FROM businesses WHERE verification_status = 'verified'").get();
  res.json({
    totalUsers: totalUsers.c,
    personalUsers: personal.c,
    businessUsers: business.c,
    pendingVerifications: pending.c,
    verifiedBusinesses: verified.c,
  });
}));

router.get('/verifications', ah(async (req, res) => {
  const rows = await db.prepare(`
    SELECT u.id AS user_id, u.full_name, u.company_name, u.phone, u.email,
           b.tax_id, b.legal_address, b.verification_status, b.document_path
    FROM businesses b JOIN users u ON u.id = b.user_id
    WHERE b.verification_status != 'none'
    ORDER BY (b.verification_status = 'pending') DESC, u.full_name ASC
  `).all();
  res.json({
    verifications: rows.map((r) => ({
      userId: r.user_id,
      fullName: r.full_name,
      companyName: r.company_name,
      phone: r.phone,
      email: r.email,
      taxId: r.tax_id,
      legalAddress: r.legal_address,
      status: r.verification_status,
      documentUploaded: !!r.document_path,
    })),
  });
}));

// Admin hujjatni ko'rib chiqishi uchun — fayl nomi bazadan olinadi, so'rovdan
// EMAS (aks holda path traversal orqali serverdagi ixtiyoriy faylni o'qib bo'lardi).
router.get('/verifications/:userId/document', ah(async (req, res) => {
  const row = await db.prepare('SELECT document_path FROM businesses WHERE user_id = ?').get(req.params.userId);
  if (!row?.document_path) return res.status(404).json({ message: 'Hujjat topilmadi' });
  res.sendFile(path.join(UPLOADS_DIR, row.document_path));
}));

router.post('/verifications/:userId/approve', ah(async (req, res) => {
  const result = await db.prepare("UPDATE businesses SET verification_status = 'verified' WHERE user_id = ?").run(req.params.userId);
  if (result.changes === 0) return res.status(404).json({ message: 'Biznes topilmadi' });
  await addNotification(req.params.userId, 'Biznes tasdiqlandi', "STIR va yuridik ma'lumotlaringiz tasdiqlandi. Hisobingiz endi to'liq tekshirilgan.", 'system');
  res.json({ ok: true });
}));

router.post('/verifications/:userId/reject', ah(async (req, res) => {
  const result = await db.prepare("UPDATE businesses SET verification_status = 'none' WHERE user_id = ?").run(req.params.userId);
  if (result.changes === 0) return res.status(404).json({ message: 'Biznes topilmadi' });
  await addNotification(req.params.userId, "Biznes ma'lumotlari rad etildi", "STIR yoki yuridik manzil noto'g'ri bo'lishi mumkin — Sozlamalar orqali qayta yuboring.", 'system');
  res.json({ ok: true });
}));

// Ism/telefon/email bo'yicha qidirish (bo'sh bo'lsa — eng so'nggi 100 ta hisob).
router.get('/users', ah(async (req, res) => {
  const q = (req.query.search || '').trim();
  const rows = q
    ? await db.prepare(`SELECT id, full_name, phone, email, account_type, role, blocked, created_at FROM users
        WHERE full_name LIKE ? OR phone LIKE ? OR email LIKE ? ORDER BY created_at DESC LIMIT 100`)
        .all(`%${q}%`, `%${q}%`, `%${q}%`)
    : await db.prepare(`SELECT id, full_name, phone, email, account_type, role, blocked, created_at
        FROM users ORDER BY created_at DESC LIMIT 100`).all();
  res.json({
    users: rows.map((r) => ({
      id: r.id, fullName: r.full_name, phone: r.phone, email: r.email || '',
      accountType: r.account_type, role: r.role, blocked: !!r.blocked, createdAt: r.created_at,
    })),
  });
}));

// Bitta foydalanuvchining to'liq holati — profil, hamyon balansi va oxirgi
// operatsiyalari, (agar bor bo'lsa) biznes balansi va oxirgi operatsiyalari.
router.get('/users/:userId', ah(async (req, res) => {
  const user = await db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.userId);
  if (!user) return res.status(404).json({ message: 'Foydalanuvchi topilmadi' });
  const wallet = await db.prepare('SELECT balance FROM wallets WHERE user_id = ?').get(user.id);
  const walletTx = await db.prepare('SELECT * FROM wallet_transactions WHERE user_id = ? ORDER BY sort_order DESC LIMIT 20').all(user.id);
  const business = await db.prepare('SELECT balance_available, balance_pending, verification_status FROM businesses WHERE user_id = ?').get(user.id);
  const bizTx = await db.prepare('SELECT * FROM biz_transactions WHERE user_id = ? ORDER BY sort_order DESC LIMIT 20').all(user.id);
  res.json({
    user: {
      id: user.id, fullName: user.full_name, phone: user.phone, email: user.email || '',
      accountType: user.account_type, role: user.role, blocked: !!user.blocked, createdAt: user.created_at,
    },
    wallet: { balance: wallet?.balance ?? 0, transactions: walletTx.map(rowToWalletTx) },
    business: business ? {
      balance: business.balance_available, pending: business.balance_pending,
      verificationStatus: business.verification_status || 'none',
    } : null,
    businessTransactions: bizTx.map(rowToBizTx),
  });
}));

// Founder/admin hisobni tasodifan (yoki suiiste'mol qilib) bloklab qo'yishning
// oldini olish uchun 'admin' rolidagi hisoblarni bloklash taqiqlanadi.
router.post('/users/:userId/block', ah(async (req, res) => {
  const target = await db.prepare('SELECT role FROM users WHERE id = ?').get(req.params.userId);
  if (!target) return res.status(404).json({ message: 'Foydalanuvchi topilmadi' });
  if (target.role === 'admin') return res.status(400).json({ message: "Admin hisobni bloklab bo'lmaydi" });
  await db.prepare('UPDATE users SET blocked = 1 WHERE id = ?').run(req.params.userId);
  res.json({ ok: true });
}));

router.post('/users/:userId/unblock', ah(async (req, res) => {
  const result = await db.prepare('UPDATE users SET blocked = 0 WHERE id = ?').run(req.params.userId);
  if (result.changes === 0) return res.status(404).json({ message: 'Foydalanuvchi topilmadi' });
  res.json({ ok: true });
}));

// Butun platforma bo'ylab (hamma foydalanuvchilarning shaxsiy + biznes)
// so'nggi operatsiyalari — audit/kuzatuv uchun.
router.get('/transactions', ah(async (req, res) => {
  const walletRows = await db.prepare(`
    SELECT wt.id, wt.name, wt.status, wt.amount, u.full_name AS user_name, u.phone AS user_phone
    FROM wallet_transactions wt JOIN users u ON u.id = wt.user_id
    ORDER BY wt.id DESC LIMIT 150
  `).all();
  const bizRows = await db.prepare(`
    SELECT bt.id, bt.name, bt.status, bt.amount, u.full_name AS user_name, u.phone AS user_phone
    FROM biz_transactions bt JOIN users u ON u.id = bt.user_id
    ORDER BY bt.id DESC LIMIT 150
  `).all();

  // `uid()` "<prefiks>-<millisekund>-<hisoblagich>-<tasodifiy>" shaklida ID
  // yaratadi. Prefiks jadvallar orasida har xil (tx/btx) bo'lgani uchun ID
  // matnini to'g'ridan-to'g'ri solishtirib bo'lmaydi — millisekund qismini
  // ajratib, SON sifatida solishtirib, ikkala manbani vaqt bo'yicha birlashtiramiz.
  const withTs = (rows, source) => rows.map((r) => ({ ...r, source, ts: Number(r.id.split('-')[1] || 0) }));
  const merged = [...withTs(walletRows, 'wallet'), ...withTs(bizRows, 'business')]
    .sort((a, b) => b.ts - a.ts)
    .slice(0, 150);

  res.json({
    transactions: merged.map((r) => ({
      id: r.id, source: r.source, name: r.name, status: r.status, amount: r.amount,
      in: r.amount > 0, userName: r.user_name, userPhone: r.user_phone,
    })),
  });
}));

export default router;
