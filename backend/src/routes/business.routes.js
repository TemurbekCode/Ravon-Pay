import { Router } from 'express';
import { db, uid, nowLabel, isFounder } from '../db.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { requireSubscription } from '../middleware/requireSubscription.js';
import { getBusiness, getNotifications, addNotification, nextSortOrder, formatCurrency, getWallet } from '../helpers.js';
import { validateCard } from '../cardValidation.js';

const router = Router();
router.use(requireAuth);

const CUSTOMER_GRADS = ['#10B981,#22D3EE', '#F59E0B,#EF4444', '#EC4899,#8B5CF6', '#8B5CF6,#6366F1', '#06B6D4,#3B82F6'];
const TEAM_GRADS = ['#6366F1,#8B5CF6', '#10B981,#22D3EE', '#EC4899,#8B5CF6', '#06B6D4,#3B82F6'];
const PLAN_LABELS = { monthly: 'Oylik', yearly: 'Yillik' };

// Obuna holatini tekshirish/sotib olish — bularga hali obuna faol bo'lmasa ham
// murojaat qilish mumkin (aks holda foydalanuvchi hech qachon to'lov qila olmaydi).
router.get('/subscription', (req, res) => {
  const row = db.prepare('SELECT subscription_active, subscription_plan FROM businesses WHERE user_id = ?').get(req.userId);
  res.json({
    active: !!row?.subscription_active,
    plan: row?.subscription_plan || '',
    founder: isFounder(req.dbUser.email),
  });
});

// To'lov haqiqiy kartani talab qiladi: yoki mavjud saqlangan kartadan biri
// (cardId) tanlanadi, yoki yangi karta ma'lumotlari kiritiladi (tekshirilib,
// kartalar ro'yxatiga qo'shiladi). Haqiqiy to'lov provayderi ulanmagani uchun
// undirishning o'zi simulyatsiya qilinadi — lekin karta har doim haqiqiy bo'lishi shart.
router.post('/subscribe', (req, res) => {
  const { plan, cardId, cardNumber, expiry, cardholderName } = req.body || {};
  if (!PLAN_LABELS[plan]) return res.status(400).json({ message: "Noto'g'ri reja" });

  let card;
  if (cardId) {
    card = db.prepare('SELECT * FROM cards WHERE id = ? AND user_id = ?').get(cardId, req.userId);
    if (!card) return res.status(400).json({ message: 'Karta topilmadi' });
  } else {
    const result = validateCard({ cardNumber, expiry, cardholderName });
    if (result.error) return res.status(400).json({ message: result.error });
    const cards = getWallet(req.userId).cards;
    const variant = cards.length % 2 === 0 ? 'v1' : 'v2';
    card = {
      id: uid('card'), variant, type: result.type, num: result.masked,
      exp: result.expiry, holder: result.holder, balance: 0, frozen: false,
    };
    const order = nextSortOrder('cards', req.userId);
    db.prepare('INSERT INTO cards (id, user_id, variant, type, num, exp, holder, balance, frozen, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?)')
      .run(card.id, req.userId, card.variant, card.type, card.num, card.exp, card.holder, card.balance, order);
  }

  db.prepare('UPDATE businesses SET subscription_active = 1, subscription_plan = ?, subscription_started_at = ? WHERE user_id = ?')
    .run(plan, new Date().toISOString(), req.userId);
  addNotification(req.userId, "Obuna faollashtirildi", `${PLAN_LABELS[plan]} reja bo'yicha ${card.num} kartasidan to'lov muvaffaqiyatli amalga oshirildi. Biznes paneliga xush kelibsiz!`, 'system');
  res.json({ active: true, plan, founder: isFounder(req.dbUser.email), card: cardId ? undefined : card });
});

router.use(requireSubscription);

router.get('/overview', (req, res) => {
  res.json(getBusiness(req.userId));
});

router.get('/balance', (req, res) => {
  const b = getBusiness(req.userId);
  res.json({ balance: b.balance, payouts: b.payouts });
});

router.post('/withdraw', (req, res) => {
  const amount = Number(req.body?.amount) || 0;
  const card = db.prepare('SELECT * FROM cards WHERE id = ? AND user_id = ?').get(req.body?.cardId, req.userId);
  if (!card) return res.status(400).json({ message: 'Karta topilmadi' });
  const row = db.prepare('SELECT balance_available FROM businesses WHERE user_id = ?').get(req.userId);
  if (amount > row.balance_available) return res.status(400).json({ message: 'INSUFFICIENT_BALANCE' });
  db.prepare('UPDATE businesses SET balance_available = balance_available - ? WHERE user_id = ?').run(amount, req.userId);
  const order = nextSortOrder('biz_payouts', req.userId);
  db.prepare('INSERT INTO biz_payouts (id, user_id, name, date, amount, status, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .run(uid('po'), req.userId, `${card.num} kartasiga`, nowLabel(), -amount, 'pending', order);
  addNotification(req.userId, "Yechib olish so'rovi", `${formatCurrency(amount)} so'm ${card.num} kartangizga yechib olinmoqda`, 'out');
  const b = getBusiness(req.userId);
  res.json({ balance: b.balance, payouts: b.payouts, notifications: getNotifications(req.userId) });
});

router.get('/invoices', (req, res) => {
  res.json({ invoices: getBusiness(req.userId).invoices });
});

router.post('/invoices', (req, res) => {
  const { client, due } = req.body || {};
  const amount = Number(req.body?.amount) || 0;
  const count = db.prepare('SELECT COUNT(*) AS c FROM biz_invoices WHERE user_id = ?').get(req.userId).c;
  const invoice = { id: uid('inv'), num: `INV-${1043 + count}`, client, due, amount, status: 'pending' };
  const order = nextSortOrder('biz_invoices', req.userId);
  db.prepare('INSERT INTO biz_invoices (id, user_id, num, client, due, amount, status, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
    .run(invoice.id, req.userId, invoice.num, invoice.client, invoice.due, invoice.amount, invoice.status, order);
  res.json(invoice);
});

// Mijoz to'lov qilganda — mavjud mijoz bo'lsa buyurtma/summasini oshiradi, yangi bo'lsa qo'shadi.
function upsertCustomer(userId, name, amount) {
  const existing = db.prepare('SELECT * FROM biz_customers WHERE user_id = ? AND LOWER(name) = ?').get(userId, (name || '').toLowerCase());
  if (existing) {
    db.prepare('UPDATE biz_customers SET orders = orders + 1, total = total + ? WHERE id = ?').run(amount, existing.id);
    return;
  }
  const count = db.prepare('SELECT COUNT(*) AS c FROM biz_customers WHERE user_id = ?').get(userId).c;
  const initials = (name || '').split(' ').map((p) => p[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();
  db.prepare('INSERT INTO biz_customers (id, user_id, initials, grad, name, email, orders, total) VALUES (?, ?, ?, ?, ?, ?, 1, ?)')
    .run(uid('cus'), userId, initials, CUSTOMER_GRADS[count % CUSTOMER_GRADS.length], name, `${(name || '').toLowerCase().replace(/\s+/g, '.')}@email.com`, amount);
}

router.post('/invoices/:id/pay', (req, res) => {
  const invoice = db.prepare('SELECT * FROM biz_invoices WHERE id = ? AND user_id = ?').get(req.params.id, req.userId);
  if (!invoice || invoice.status === 'done') {
    const b = getBusiness(req.userId);
    return res.json({ ...b, notifications: getNotifications(req.userId) });
  }
  db.prepare("UPDATE biz_invoices SET status = 'done' WHERE id = ?").run(invoice.id);
  db.prepare('UPDATE businesses SET revenue = revenue + ?, sales_count = sales_count + 1, balance_available = balance_available + ? WHERE user_id = ?')
    .run(invoice.amount, invoice.amount, req.userId);
  const biz = db.prepare('SELECT revenue, sales_count FROM businesses WHERE user_id = ?').get(req.userId);
  const avgOrder = Math.round(biz.revenue / biz.sales_count);
  db.prepare('UPDATE businesses SET avg_order = ? WHERE user_id = ?').run(avgOrder, req.userId);

  const order = nextSortOrder('biz_transactions', req.userId);
  db.prepare(`INSERT INTO biz_transactions (id, user_id, initials, grad, name, email, mi, method, status, date, amount, is_in, sort_order)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'done', ?, ?, 1, ?)`)
    .run(uid('btx'), req.userId, invoice.client.slice(0, 2).toUpperCase(), '#6366F1,#8B5CF6', invoice.client, '', '', invoice.num, nowLabel(), invoice.amount, order);

  upsertCustomer(req.userId, invoice.client, invoice.amount);
  addNotification(req.userId, "Yangi to'lov qabul qilindi", `${invoice.client}: +${formatCurrency(invoice.amount)} so'm`, 'in');

  const b = getBusiness(req.userId);
  res.json({ ...b, notifications: getNotifications(req.userId) });
});

router.get('/checkout-pages', (req, res) => {
  res.json({ checkoutPages: getBusiness(req.userId).checkoutPages });
});

router.post('/checkout-pages', (req, res) => {
  const { title } = req.body || {};
  const page = { id: uid('chk'), title, slug: (title || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 24) || uid('p'), views: 0, active: true };
  const order = nextSortOrder('biz_checkout_pages', req.userId);
  db.prepare('INSERT INTO biz_checkout_pages (id, user_id, title, slug, views, active, sort_order) VALUES (?, ?, ?, ?, 0, 1, ?)')
    .run(page.id, req.userId, page.title, page.slug, order);
  res.json(page);
});

router.post('/checkout-pages/:id/toggle', (req, res) => {
  const page = db.prepare('SELECT * FROM biz_checkout_pages WHERE id = ? AND user_id = ?').get(req.params.id, req.userId);
  if (!page) return res.status(404).json({ message: 'Sahifa topilmadi' });
  db.prepare('UPDATE biz_checkout_pages SET active = ? WHERE id = ?').run(page.active ? 0 : 1, page.id);
  res.json({ checkoutPages: getBusiness(req.userId).checkoutPages });
});

router.get('/team', (req, res) => {
  res.json({ team: getBusiness(req.userId).team });
});

router.post('/team', (req, res) => {
  const { email, role } = req.body || {};
  const count = db.prepare('SELECT COUNT(*) AS c FROM biz_team WHERE user_id = ?').get(req.userId).c;
  const member = {
    id: uid('tm'),
    initials: (email || '').slice(0, 2).toUpperCase(),
    grad: TEAM_GRADS[count % TEAM_GRADS.length],
    name: (email || '').split('@')[0],
    email,
    roleKey: role === 'admin' ? 'team.admin' : 'team.member',
  };
  const order = nextSortOrder('biz_team', req.userId);
  db.prepare('INSERT INTO biz_team (id, user_id, initials, grad, name, email, role_key, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
    .run(member.id, req.userId, member.initials, member.grad, member.name, member.email, member.roleKey, order);
  res.json(member);
});

router.get('/customers', (req, res) => {
  res.json({ customers: getBusiness(req.userId).customers });
});

router.get('/transactions', (req, res) => {
  res.json({ transactions: getBusiness(req.userId).transactions });
});

export default router;
