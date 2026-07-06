import { Router } from 'express';
import { db, uid, nowLabel } from '../db.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { getWallet, getNotifications, addNotification, nextSortOrder, formatCurrency, creditWallet, parsePositiveAmount, verifyTwoFaCode } from '../helpers.js';
import { getPaymentProvider } from '../payments/PaymentProvider.js';
import { reservePaymeOrder } from '../payments/PaymeProvider.js';
import { reserveClickOrder } from '../payments/ClickProvider.js';
import { ah } from '../asyncHandler.js';

const router = Router();
router.use(requireAuth);

router.get('/balance', ah(async (req, res) => {
  const w = await getWallet(req.userId);
  res.json({ balance: w.balance, baseline: w.baseline });
}));

// PAYMENT_PROVIDER sozlanmagan bo'lsa (standart) — pul darhol hamyonga tushadi,
// joriy demo xatti-harakati o'zgarishsiz qoladi. Payme/Click sozlansa — foydalanuvchi
// checkout havolasiga yo'naltiriladi, pul webhook orqali keyinroq tasdiqlanadi.
router.post('/topup', ah(async (req, res) => {
  const amount = parsePositiveAmount(req.body?.amount);
  if (amount === null) return res.status(400).json({ message: "Summa noto'g'ri" });
  const provider = getPaymentProvider();
  const orderId = uid('topup');

  const result = await provider.createTopUpCheckout({ userId: req.userId, amount, orderId });
  if (result.mode === 'redirect') {
    if (provider.name === 'payme') await reservePaymeOrder({ userId: req.userId, orderId, amount });
    if (provider.name === 'click') await reserveClickOrder({ userId: req.userId, orderId, amount });
    return res.json({ mode: 'redirect', checkoutUrl: result.checkoutUrl });
  }

  await creditWallet(req.userId, amount);
  res.json({ ...(await getWallet(req.userId)), notifications: await getNotifications(req.userId) });
}));

router.post('/withdraw', ah(async (req, res) => {
  const amount = parsePositiveAmount(req.body?.amount);
  if (amount === null) return res.status(400).json({ message: "Summa noto'g'ri" });
  if (req.dbUser.two_fa_enabled) {
    if (!req.body?.twoFaCode) return res.status(428).json({ message: '2FA_REQUIRED' });
    const check = await verifyTwoFaCode(req.dbUser.phone, req.body.twoFaCode);
    if (!check.ok) return res.status(400).json({ message: check.message });
  }
  const card = await db.prepare('SELECT * FROM cards WHERE id = ? AND user_id = ?').get(req.body?.cardId, req.userId);
  if (!card) return res.status(400).json({ message: 'Karta topilmadi' });
  const w = await db.prepare('SELECT balance FROM wallets WHERE user_id = ?').get(req.userId);
  if (amount > w.balance) return res.status(400).json({ message: 'INSUFFICIENT_BALANCE' });

  const provider = getPaymentProvider();
  let payout;
  try {
    payout = await provider.createPayout({ userId: req.userId, amount, card });
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }

  // Yuqoridagi tekshiruv (SELECT) bilan bu yerdagi yozish orasida boshqa
  // so'rov ham balansni kamaytirgan bo'lishi mumkin — shuning uchun yakuniy
  // yechish HAM shart bo'lgan balansni o'zi ichida tekshiradigan, atomik
  // buyruq orqali amalga oshiriladi (bir vaqtda kelgan ikkita so'rov balansni
  // manfiyga tushirib qo'yishining oldini oladi).
  const debit = await db.prepare('UPDATE wallets SET balance = balance - ? WHERE user_id = ? AND balance >= ?').run(amount, req.userId, amount);
  if (debit.changes === 0) {
    // Payout provayderi (hozircha Mock) allaqachon "muvaffaqiyatli" javob bergan,
    // lekin balans oxirgi lahzada yetarli bo'lmay qoldi — juda kam uchraydigan holat,
    // haqiqiy provayder ulanganda bu qo'llab-quvvatlash/solishtirish (reconciliation)
    // talab qilishi mumkin.
    return res.status(409).json({ message: "Balans oxirgi lahzada o'zgardi, qaytadan urinib ko'ring" });
  }
  const fresh = await db.prepare('SELECT balance FROM wallets WHERE user_id = ?').get(req.userId);
  const order = await nextSortOrder('wallet_transactions', req.userId);
  await db.prepare('INSERT INTO wallet_transactions (id, user_id, type, name, date, status, amount, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
    .run(uid('tx'), req.userId, 'out', `${card.num} kartasiga yechildi`, nowLabel(), payout.status === 'done' ? 'done' : 'pending', -amount, order);
  await addNotification(req.userId, 'Pul yechildi', `-${formatCurrency(amount)} so'm ${card.num} kartangizga yechib olindi. Balans: ${formatCurrency(fresh.balance)} so'm`, 'out');
  res.json({ ...(await getWallet(req.userId)), notifications: await getNotifications(req.userId) });
}));

export default router;
