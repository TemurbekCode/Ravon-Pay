import { Router } from 'express';
import { db, uid, nowLabel, isFounder } from '../db.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { requireSubscription } from '../middleware/requireSubscription.js';
import { getBusiness, getNotifications, addNotification, nextSortOrder, formatCurrency, getWallet, parsePositiveAmount, verifyTwoFaCode } from '../helpers.js';
import { validateCard } from '../cardValidation.js';
import { uploadDocument } from '../uploadConfig.js';
import { ah } from '../asyncHandler.js';

const router = Router();
router.use(requireAuth);

const CUSTOMER_GRADS = ['#10B981,#22D3EE', '#F59E0B,#EF4444', '#EC4899,#8B5CF6', '#8B5CF6,#6366F1', '#06B6D4,#3B82F6'];
const TEAM_GRADS = ['#6366F1,#8B5CF6', '#10B981,#22D3EE', '#EC4899,#8B5CF6', '#06B6D4,#3B82F6'];
const PLAN_LABELS = { monthly: 'Oylik', yearly: 'Yillik' };

// Obuna holatini tekshirish/sotib olish — bularga hali obuna faol bo'lmasa ham
// murojaat qilish mumkin (aks holda foydalanuvchi hech qachon to'lov qila olmaydi).
router.get('/subscription', ah(async (req, res) => {
  const row = await db.prepare('SELECT subscription_active, subscription_plan FROM businesses WHERE user_id = ?').get(req.userId);
  res.json({
    active: !!row?.subscription_active,
    plan: row?.subscription_plan || '',
    founder: isFounder(req.dbUser.email),
  });
}));

// To'lov haqiqiy kartani talab qiladi: yoki mavjud saqlangan kartadan biri
// (cardId) tanlanadi, yoki yangi karta ma'lumotlari kiritiladi (tekshirilib,
// kartalar ro'yxatiga qo'shiladi). Haqiqiy to'lov provayderi ulanmagani uchun
// undirishning o'zi simulyatsiya qilinadi — lekin karta har doim haqiqiy bo'lishi shart.
router.post('/subscribe', ah(async (req, res) => {
  const { plan, cardId, cardNumber, expiry, cardholderName } = req.body || {};
  if (!PLAN_LABELS[plan]) return res.status(400).json({ message: "Noto'g'ri reja" });

  let card;
  if (cardId) {
    card = await db.prepare('SELECT * FROM cards WHERE id = ? AND user_id = ?').get(cardId, req.userId);
    if (!card) return res.status(400).json({ message: 'Karta topilmadi' });
  } else {
    const result = validateCard({ cardNumber, expiry, cardholderName });
    if (result.error) return res.status(400).json({ message: result.error });
    const cards = (await getWallet(req.userId)).cards;
    const variant = cards.length % 2 === 0 ? 'v1' : 'v2';
    card = {
      id: uid('card'), variant, type: result.type, num: result.masked,
      exp: result.expiry, holder: result.holder, balance: 0, frozen: false,
    };
    const order = await nextSortOrder('cards', req.userId);
    await db.prepare('INSERT INTO cards (id, user_id, variant, type, num, exp, holder, balance, frozen, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?)')
      .run(card.id, req.userId, card.variant, card.type, card.num, card.exp, card.holder, card.balance, order);
  }

  await db.prepare('UPDATE businesses SET subscription_active = 1, subscription_plan = ?, subscription_started_at = ? WHERE user_id = ?')
    .run(plan, new Date().toISOString(), req.userId);
  await addNotification(req.userId, "Obuna faollashtirildi", `${PLAN_LABELS[plan]} reja bo'yicha ${card.num} kartasidan to'lov muvaffaqiyatli amalga oshirildi. Biznes paneliga xush kelibsiz!`, 'system');
  await addNotification(req.userId, "Biznes ma'lumotlaringizni to'ldiring", "STIR va yuridik manzilingizni qo'shing — bu hisobingiz ishonchliligini oshiradi. Sozlamalar bo'limidan istalgan vaqtda qo'shishingiz mumkin.", 'bizinfo');
  res.json({ active: true, plan, founder: isFounder(req.dbUser.email), card: cardId ? undefined : card });
}));

router.use(requireSubscription);

router.get('/overview', ah(async (req, res) => {
  res.json(await getBusiness(req.userId));
}));

router.get('/balance', ah(async (req, res) => {
  const b = await getBusiness(req.userId);
  res.json({ balance: b.balance, payouts: b.payouts });
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
  const row = await db.prepare('SELECT balance_available FROM businesses WHERE user_id = ?').get(req.userId);
  if (amount > row.balance_available) return res.status(400).json({ message: 'INSUFFICIENT_BALANCE' });
  // Atomik, shart bilan yozish — tepadagi tekshiruv bilan bu yozish orasidagi
  // "race condition" balansni manfiyga tushirib qo'yishining oldini oladi.
  const debit = await db.prepare('UPDATE businesses SET balance_available = balance_available - ? WHERE user_id = ? AND balance_available >= ?').run(amount, req.userId, amount);
  if (debit.changes === 0) return res.status(400).json({ message: 'INSUFFICIENT_BALANCE' });
  const order = await nextSortOrder('biz_payouts', req.userId);
  await db.prepare('INSERT INTO biz_payouts (id, user_id, name, date, amount, status, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .run(uid('po'), req.userId, `${card.num} kartasiga`, nowLabel(), -amount, 'pending', order);
  await addNotification(req.userId, "Yechib olish so'rovi", `${formatCurrency(amount)} so'm ${card.num} kartangizga yechib olinmoqda`, 'out');
  const b = await getBusiness(req.userId);
  res.json({ balance: b.balance, payouts: b.payouts, notifications: await getNotifications(req.userId) });
}));

router.patch('/verification', ah(async (req, res) => {
  const { taxId, legalAddress } = req.body || {};
  if (!taxId || !legalAddress) return res.status(400).json({ message: "STIR va yuridik manzil to'ldirilishi shart" });
  await db.prepare("UPDATE businesses SET tax_id = ?, legal_address = ?, verification_status = 'pending' WHERE user_id = ?")
    .run(taxId, legalAddress, req.userId);
  res.json({ verification: { status: 'pending', taxId, legalAddress } });
}));

// Hujjat (STIR guvohnomasi va h.k.) yuklash — mexanizm to'liq ishlaydi va
// test qilingan, lekin frontend'da hozircha "hali qo'shilmagan" deb ko'rsatiladi
// (haqiqiy foydalanuvchilar hali hujjat yubora olmaydi, faqat kelajakda shu
// tugmani yoqish kifoya).
router.post('/verification/document', (req, res, next) => {
  uploadDocument.single('document')(req, res, (err) => {
    if (err) return res.status(400).json({ message: err.message === 'File too large' ? "Fayl hajmi 5MB dan katta bo'lmasligi kerak" : err.message });
    next();
  });
}, ah(async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'Fayl talab qilinadi' });
  await db.prepare('UPDATE businesses SET document_path = ?, document_uploaded_at = ? WHERE user_id = ?')
    .run(req.file.filename, new Date().toISOString(), req.userId);
  res.json({ documentUploaded: true });
}));

router.post('/utilities/pay', ah(async (req, res) => {
  const { category, account } = req.body || {};
  const amount = parsePositiveAmount(req.body?.amount);
  if (amount === null) return res.status(400).json({ message: "Summa noto'g'ri" });
  const row = await db.prepare('SELECT balance_available FROM businesses WHERE user_id = ?').get(req.userId);
  if (amount > row.balance_available) return res.status(400).json({ message: 'INSUFFICIENT_BALANCE' });
  const debit = await db.prepare('UPDATE businesses SET balance_available = balance_available - ? WHERE user_id = ? AND balance_available >= ?').run(amount, req.userId, amount);
  if (debit.changes === 0) return res.status(400).json({ message: 'INSUFFICIENT_BALANCE' });
  const order = await nextSortOrder('biz_transactions', req.userId);
  await db.prepare(`INSERT INTO biz_transactions (id, user_id, initials, grad, name, email, mi, method, status, date, amount, is_in, sort_order)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'done', ?, ?, 0, ?)`)
    .run(uid('btx'), req.userId, 'UT', '#F59E0B,#EF4444', "Kommunal to'lov", account, '', category, nowLabel(), -amount, order);
  await addNotification(req.userId, "To'lov amalga oshirildi", `${category} uchun ${formatCurrency(amount)} so'm to'landi`, 'out');
  const b = await getBusiness(req.userId);
  res.json({ ...b, notifications: await getNotifications(req.userId) });
}));

router.get('/invoices', ah(async (req, res) => {
  res.json({ invoices: (await getBusiness(req.userId)).invoices });
}));

router.post('/invoices', ah(async (req, res) => {
  const { client, due } = req.body || {};
  const amount = parsePositiveAmount(req.body?.amount);
  if (amount === null) return res.status(400).json({ message: "Summa noto'g'ri" });
  const countRow = await db.prepare('SELECT COUNT(*) AS c FROM biz_invoices WHERE user_id = ?').get(req.userId);
  const invoice = { id: uid('inv'), num: `INV-${1043 + countRow.c}`, client, due, amount, status: 'pending' };
  const order = await nextSortOrder('biz_invoices', req.userId);
  await db.prepare('INSERT INTO biz_invoices (id, user_id, num, client, due, amount, status, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
    .run(invoice.id, req.userId, invoice.num, invoice.client, invoice.due, invoice.amount, invoice.status, order);
  res.json(invoice);
}));

// Mijoz to'lov qilganda — mavjud mijoz bo'lsa buyurtma/summasini oshiradi, yangi bo'lsa qo'shadi.
async function upsertCustomer(userId, name, amount) {
  const existing = await db.prepare('SELECT * FROM biz_customers WHERE user_id = ? AND LOWER(name) = ?').get(userId, (name || '').toLowerCase());
  if (existing) {
    await db.prepare('UPDATE biz_customers SET orders = orders + 1, total = total + ? WHERE id = ?').run(amount, existing.id);
    return;
  }
  const countRow = await db.prepare('SELECT COUNT(*) AS c FROM biz_customers WHERE user_id = ?').get(userId);
  const initials = (name || '').split(' ').map((p) => p[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();
  await db.prepare('INSERT INTO biz_customers (id, user_id, initials, grad, name, email, orders, total) VALUES (?, ?, ?, ?, ?, ?, 1, ?)')
    .run(uid('cus'), userId, initials, CUSTOMER_GRADS[countRow.c % CUSTOMER_GRADS.length], name, `${(name || '').toLowerCase().replace(/\s+/g, '.')}@email.com`, amount);
}

router.post('/invoices/:id/pay', ah(async (req, res) => {
  const invoice = await db.prepare('SELECT * FROM biz_invoices WHERE id = ? AND user_id = ?').get(req.params.id, req.userId);
  if (!invoice || invoice.status === 'done') {
    const b = await getBusiness(req.userId);
    return res.json({ ...b, notifications: await getNotifications(req.userId) });
  }
  await db.prepare("UPDATE biz_invoices SET status = 'done' WHERE id = ?").run(invoice.id);
  await db.prepare('UPDATE businesses SET revenue = revenue + ?, sales_count = sales_count + 1, balance_available = balance_available + ? WHERE user_id = ?')
    .run(invoice.amount, invoice.amount, req.userId);
  const biz = await db.prepare('SELECT revenue, sales_count FROM businesses WHERE user_id = ?').get(req.userId);
  const avgOrder = Math.round(biz.revenue / biz.sales_count);
  await db.prepare('UPDATE businesses SET avg_order = ? WHERE user_id = ?').run(avgOrder, req.userId);

  const order = await nextSortOrder('biz_transactions', req.userId);
  await db.prepare(`INSERT INTO biz_transactions (id, user_id, initials, grad, name, email, mi, method, status, date, amount, is_in, sort_order)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'done', ?, ?, 1, ?)`)
    .run(uid('btx'), req.userId, invoice.client.slice(0, 2).toUpperCase(), '#6366F1,#8B5CF6', invoice.client, '', '', invoice.num, nowLabel(), invoice.amount, order);

  await upsertCustomer(req.userId, invoice.client, invoice.amount);
  await addNotification(req.userId, "Yangi to'lov qabul qilindi", `${invoice.client}: +${formatCurrency(invoice.amount)} so'm`, 'in');

  const b = await getBusiness(req.userId);
  res.json({ ...b, notifications: await getNotifications(req.userId) });
}));

router.get('/checkout-pages', ah(async (req, res) => {
  res.json({ checkoutPages: (await getBusiness(req.userId)).checkoutPages });
}));

router.post('/checkout-pages', ah(async (req, res) => {
  const { title } = req.body || {};
  const page = { id: uid('chk'), title, slug: (title || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 24) || uid('p'), views: 0, active: true };
  const order = await nextSortOrder('biz_checkout_pages', req.userId);
  await db.prepare('INSERT INTO biz_checkout_pages (id, user_id, title, slug, views, active, sort_order) VALUES (?, ?, ?, ?, 0, 1, ?)')
    .run(page.id, req.userId, page.title, page.slug, order);
  res.json(page);
}));

router.post('/checkout-pages/:id/toggle', ah(async (req, res) => {
  const page = await db.prepare('SELECT * FROM biz_checkout_pages WHERE id = ? AND user_id = ?').get(req.params.id, req.userId);
  if (!page) return res.status(404).json({ message: 'Sahifa topilmadi' });
  await db.prepare('UPDATE biz_checkout_pages SET active = ? WHERE id = ?').run(page.active ? 0 : 1, page.id);
  res.json({ checkoutPages: (await getBusiness(req.userId)).checkoutPages });
}));

router.get('/team', ah(async (req, res) => {
  res.json({ team: (await getBusiness(req.userId)).team });
}));

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

router.post('/team', ah(async (req, res) => {
  const { email, role } = req.body || {};
  if (typeof email !== 'string' || !EMAIL_RE.test(email)) {
    return res.status(400).json({ message: "Email noto'g'ri" });
  }
  const countRow = await db.prepare('SELECT COUNT(*) AS c FROM biz_team WHERE user_id = ?').get(req.userId);
  const member = {
    id: uid('tm'),
    initials: (email || '').slice(0, 2).toUpperCase(),
    grad: TEAM_GRADS[countRow.c % TEAM_GRADS.length],
    name: (email || '').split('@')[0],
    email,
    roleKey: role === 'admin' ? 'team.admin' : 'team.member',
  };
  const order = await nextSortOrder('biz_team', req.userId);
  await db.prepare('INSERT INTO biz_team (id, user_id, initials, grad, name, email, role_key, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
    .run(member.id, req.userId, member.initials, member.grad, member.name, member.email, member.roleKey, order);
  res.json(member);
}));

router.get('/customers', ah(async (req, res) => {
  res.json({ customers: (await getBusiness(req.userId)).customers });
}));

router.get('/transactions', ah(async (req, res) => {
  res.json({ transactions: (await getBusiness(req.userId)).transactions });
}));

export default router;
