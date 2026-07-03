import { Router } from 'express';
import { db, uid, nowLabel } from '../db.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { getWallet, getNotifications, addNotification, nextSortOrder, formatCurrency, creditWallet } from '../helpers.js';
import { getPaymentProvider } from '../payments/PaymentProvider.js';
import { reservePaymeOrder } from '../payments/PaymeProvider.js';
import { reserveClickOrder } from '../payments/ClickProvider.js';
import { ah } from '../asyncHandler.js';

const router = Router();
router.use(requireAuth);

router.get('/balance', ah(async (req, res) => {
  res.json({ balance: (await getWallet(req.userId)).balance });
}));

// PAYMENT_PROVIDER sozlanmagan bo'lsa (standart) — pul darhol hamyonga tushadi,
// joriy demo xatti-harakati o'zgarishsiz qoladi. Payme/Click sozlansa — foydalanuvchi
// checkout havolasiga yo'naltiriladi, pul webhook orqali keyinroq tasdiqlanadi.
router.post('/topup', ah(async (req, res) => {
  const amount = Number(req.body?.amount) || 0;
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
  const amount = Number(req.body?.amount) || 0;
  const card = await db.prepare('SELECT * FROM cards WHERE id = ? AND user_id = ?').get(req.body?.cardId, req.userId);
  if (!card) return res.status(400).json({ message: 'Karta topilmadi' });
  const w = await db.prepare('SELECT balance FROM wallets WHERE user_id = ?').get(req.userId);
  if (amount > w.balance) return res.status(400).json({ message: 'INSUFFICIENT_BALANCE' });
  const newBalance = w.balance - amount;
  await db.prepare('UPDATE wallets SET balance = ? WHERE user_id = ?').run(newBalance, req.userId);
  const order = await nextSortOrder('wallet_transactions', req.userId);
  await db.prepare('INSERT INTO wallet_transactions (id, user_id, type, name, date, status, amount, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
    .run(uid('tx'), req.userId, 'out', `${card.num} kartasiga yechildi`, nowLabel(), 'done', -amount, order);
  await addNotification(req.userId, 'Pul yechildi', `-${formatCurrency(amount)} so'm ${card.num} kartangizga yechib olindi. Balans: ${formatCurrency(newBalance)} so'm`, 'out');
  res.json({ ...(await getWallet(req.userId)), notifications: await getNotifications(req.userId) });
}));

export default router;
