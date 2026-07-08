import { Router } from 'express';
import path from 'node:path';
import { db } from '../db.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { requireAdmin } from '../middleware/requireAdmin.js';
import { addNotification } from '../helpers.js';
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

export default router;
