import { Router } from 'express';
import { db, uid, nowLabel } from '../db.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { getWallet, getNotifications, addNotification, nextSortOrder, formatCurrency, parsePositiveAmount } from '../helpers.js';
import { ah } from '../asyncHandler.js';

const router = Router();
router.use(requireAuth);

router.post('/pay', ah(async (req, res) => {
  const { category, account } = req.body || {};
  const amount = parsePositiveAmount(req.body?.amount);
  if (amount === null) return res.status(400).json({ message: "Summa noto'g'ri" });
  // Atomik, o'z ichida shart tekshiradigan yozish — SELECT+UPDATE oralig'idagi
  // "race condition"ning oldini oladi (bir vaqtda kelgan ikki so'rov balansni
  // manfiyga tushirib qo'yishi mumkin edi).
  const debit = await db.prepare('UPDATE wallets SET balance = balance - ? WHERE user_id = ? AND balance >= ?').run(amount, req.userId, amount);
  if (debit.changes === 0) return res.status(400).json({ message: 'INSUFFICIENT_BALANCE' });
  const order = await nextSortOrder('wallet_transactions', req.userId);
  await db.prepare('INSERT INTO wallet_transactions (id, user_id, type, name, date, status, amount, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
    .run(uid('tx'), req.userId, 'out', `Kommunal to'lov — ${category} (${account})`, nowLabel(), 'done', -amount, order);
  await addNotification(req.userId, "To'lov amalga oshirildi", `${category} uchun ${formatCurrency(amount)} so'm to'landi`, 'out');
  res.json({ ...(await getWallet(req.userId)), notifications: await getNotifications(req.userId) });
}));

export default router;
