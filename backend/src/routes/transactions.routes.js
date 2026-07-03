import { Router } from 'express';
import { db, uid, nowLabel } from '../db.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { getWallet, getNotifications, addNotification, nextSortOrder, formatCurrency } from '../helpers.js';

const router = Router();
router.use(requireAuth);

router.get('/', (req, res) => {
  res.json({ transactions: getWallet(req.userId).transactions });
});

router.post('/send', (req, res) => {
  const { recipient } = req.body || {};
  const amount = Number(req.body?.amount) || 0;
  const w = db.prepare('SELECT balance FROM wallets WHERE user_id = ?').get(req.userId);
  if (amount > w.balance) return res.status(400).json({ message: 'INSUFFICIENT_BALANCE' });
  const newBalance = w.balance - amount;
  db.prepare('UPDATE wallets SET balance = ? WHERE user_id = ?').run(newBalance, req.userId);
  const order = nextSortOrder('wallet_transactions', req.userId);
  db.prepare('INSERT INTO wallet_transactions (id, user_id, type, name, date, status, amount, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
    .run(uid('tx'), req.userId, 'out', `${recipient} ga o'tkazma`, nowLabel(), 'done', -amount, order);
  addNotification(req.userId, 'Pul yuborildi', `${recipient}ga ${formatCurrency(amount)} so'm yuborildi. Balans: ${formatCurrency(newBalance)} so'm`, 'out');
  res.json({ ...getWallet(req.userId), notifications: getNotifications(req.userId) });
});

export default router;
