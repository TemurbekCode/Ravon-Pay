import { Router } from 'express';
import { db, uid, nowLabel } from '../db.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { getWallet, getNotifications, addNotification, creditWallet, nextSortOrder, formatCurrency, parsePositiveAmount } from '../helpers.js';
import { getPaymentProvider } from '../payments/PaymentProvider.js';
import { ah } from '../asyncHandler.js';

const router = Router();
router.use(requireAuth);

router.get('/', ah(async (req, res) => {
  res.json({ transactions: (await getWallet(req.userId)).transactions });
}));

// Qabul qiluvchi turiga qarab ikki butunlay boshqa yo'l bilan boradi:
//  - 'phone': RavonPay ichidagi haqiqiy P2P o'tkazma — agar raqam ro'yxatdan
//    o'tgan bo'lsa, ikkala hamyon ham darhol yangilanadi (chiqim + kirim).
//    Ro'yxatdan o'tmagan raqamga o'tkazish mumkin emas — buni faqat haqiqiy
//    banklararo/mobil pul tarmog'i (hali ulanmagan) ta'minlay oladi.
//  - 'card': tashqi kartaga chiqim — bu withdraw bilan bir xil operatsiya,
//    shuning uchun bir xil PaymentProvider.createPayout() orqali o'tadi:
//    hozircha (Mock) darhol simulyatsiya qilinadi, Click/Payme ulanganda esa
//    haqiqiy karta-processing chaqiruviga almashtiriladi.
router.post('/send', ah(async (req, res) => {
  const { recipient, recipientType } = req.body || {};
  const amount = parsePositiveAmount(req.body?.amount);
  if (amount === null) return res.status(400).json({ message: "Summa noto'g'ri" });
  if (!recipient) return res.status(400).json({ message: "Qabul qiluvchi kiritilmagan" });

  const w = await db.prepare('SELECT balance FROM wallets WHERE user_id = ?').get(req.userId);
  if (amount > w.balance) return res.status(400).json({ message: 'INSUFFICIENT_BALANCE' });

  if (recipientType === 'card') {
    const provider = getPaymentProvider();
    let payout;
    try {
      payout = await provider.createPayout({ userId: req.userId, amount, card: { num: recipient } });
    } catch (err) {
      return res.status(400).json({ message: err.message });
    }
    const newBalance = w.balance - amount;
    await db.prepare('UPDATE wallets SET balance = ? WHERE user_id = ?').run(newBalance, req.userId);
    const order = await nextSortOrder('wallet_transactions', req.userId);
    await db.prepare('INSERT INTO wallet_transactions (id, user_id, type, name, date, status, amount, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
      .run(uid('tx'), req.userId, 'out', `${recipient} kartasiga o'tkazma`, nowLabel(), payout.status === 'done' ? 'done' : 'pending', -amount, order);
    await addNotification(req.userId, 'Pul yuborildi', `${recipient} kartasiga ${formatCurrency(amount)} so'm yuborildi. Balans: ${formatCurrency(newBalance)} so'm`, 'out');
    return res.json({ ...(await getWallet(req.userId)), notifications: await getNotifications(req.userId) });
  }

  const normalizedPhone = recipient.replace(/\D/g, '');
  const recipientUser = await db.prepare('SELECT id, full_name FROM users WHERE phone = ?').get(normalizedPhone);
  if (!recipientUser) return res.status(404).json({ message: 'RECIPIENT_NOT_FOUND' });
  if (recipientUser.id === req.userId) return res.status(400).json({ message: "O'zingizga pul yubora olmaysiz" });

  const newBalance = w.balance - amount;
  await db.prepare('UPDATE wallets SET balance = ? WHERE user_id = ?').run(newBalance, req.userId);
  const order = await nextSortOrder('wallet_transactions', req.userId);
  await db.prepare('INSERT INTO wallet_transactions (id, user_id, type, name, date, status, amount, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
    .run(uid('tx'), req.userId, 'out', `${recipientUser.full_name} ga o'tkazma`, nowLabel(), 'done', -amount, order);
  await addNotification(req.userId, 'Pul yuborildi', `${recipientUser.full_name}ga ${formatCurrency(amount)} so'm yuborildi. Balans: ${formatCurrency(newBalance)} so'm`, 'out');

  const senderUser = await db.prepare('SELECT full_name FROM users WHERE id = ?').get(req.userId);
  await creditWallet(recipientUser.id, amount, `${senderUser.full_name} dan o'tkazma`);

  res.json({ ...(await getWallet(req.userId)), notifications: await getNotifications(req.userId) });
}));

export default router;
