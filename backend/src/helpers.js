import { db, uid, nowLabel } from './db.js';

// mockStore.js dagi formatCurrency bilan bir xil ("1 200 000" ko'rinishi).
export function formatCurrency(amount) {
  if (amount == null || Number.isNaN(amount)) return '0';
  return new Intl.NumberFormat('ru-RU').format(Math.round(Math.abs(amount)));
}

export function rowToCard(r) {
  return { id: r.id, variant: r.variant, type: r.type, num: r.num, exp: r.exp, holder: r.holder || '', balance: r.balance, frozen: !!r.frozen };
}
export function rowToWalletTx(r) {
  return { id: r.id, type: r.type, name: r.name, date: r.date, status: r.status, amount: r.amount };
}
export function rowToContact(r) {
  return { id: r.id, initials: r.initials, name: r.name, phone: r.phone, grad: r.grad };
}
export function rowToLink(r) {
  return { id: r.id, title: r.title, slug: r.slug, uses: r.uses, amount: r.amount };
}
export function rowToInvoice(r) {
  return { id: r.id, num: r.num, client: r.client, due: r.due, amount: r.amount, status: r.status };
}
export function rowToCheckoutPage(r) {
  return { id: r.id, title: r.title, slug: r.slug, views: r.views, active: !!r.active };
}
export function rowToTeamMember(r) {
  return { id: r.id, initials: r.initials, grad: r.grad, name: r.name, email: r.email, roleKey: r.role_key };
}
export function rowToCustomer(r) {
  return { id: r.id, initials: r.initials, grad: r.grad, name: r.name, email: r.email, orders: r.orders, total: r.total };
}
export function rowToBizTx(r) {
  return { id: r.id, initials: r.initials, grad: r.grad, name: r.name, email: r.email, mi: r.mi, method: r.method, status: r.status, date: r.date, amount: r.amount, in: !!r.is_in };
}
export function rowToPayout(r) {
  return { id: r.id, name: r.name, date: r.date, amount: r.amount, status: r.status };
}
export function rowToNotification(r) {
  return { id: r.id, kind: r.kind, title: r.title, body: r.body, date: r.date, read: !!r.read };
}

export function nextSortOrder(table, userId) {
  const row = db.prepare(`SELECT COALESCE(MAX(sort_order), -1) AS m FROM ${table} WHERE user_id = ?`).get(userId);
  return row.m + 1;
}

// Hamyonga pul qo'shish — hozircha instant (Mock) topup'da, keladigan real
// Payme/Click webhook'i pulni tasdiqlaganda ham (onPerform) shu funksiya orqali
// ishlatiladi, shunda ikkala yo'l bir xil yozuv qoldiradi.
export function creditWallet(userId, amount, label = "Hamyon to'ldirildi") {
  const w = db.prepare('SELECT balance FROM wallets WHERE user_id = ?').get(userId);
  const newBalance = w.balance + amount;
  db.prepare('UPDATE wallets SET balance = ? WHERE user_id = ?').run(newBalance, userId);
  const order = nextSortOrder('wallet_transactions', userId);
  db.prepare('INSERT INTO wallet_transactions (id, user_id, type, name, date, status, amount, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
    .run(uid('tx'), userId, 'in', label, nowLabel(), 'done', amount, order);
  addNotification(userId, "Hamyon to'ldirildi", `+${formatCurrency(amount)} so'm hamyoningizga tushdi. Balans: ${formatCurrency(newBalance)} so'm`, 'in');
  return newBalance;
}

export function getWallet(userId) {
  const w = db.prepare('SELECT balance FROM wallets WHERE user_id = ?').get(userId);
  const cards = db.prepare('SELECT * FROM cards WHERE user_id = ? ORDER BY sort_order ASC').all(userId).map(rowToCard);
  const transactions = db.prepare('SELECT * FROM wallet_transactions WHERE user_id = ? ORDER BY sort_order DESC').all(userId).map(rowToWalletTx);
  const contacts = db.prepare('SELECT * FROM contacts WHERE user_id = ? ORDER BY sort_order ASC').all(userId).map(rowToContact);
  return { balance: w?.balance ?? 0, cards, transactions, contacts };
}

// Har oy boshida "baseline" (solishtirish nuqtasi) joriy ko'rsatkichlarga
// qayta o'rnatiladi — shu orqali KPI foizlari "shu oy boshidan beri o'sish"ni
// ko'rsatadi. Bu funksiya har safar biznes ma'lumoti o'qilganda chaqiriladi,
// shuning uchun alohida cron/schedule kerak emas — oy almashgani birinchi
// so'rovda avtomatik payqaladi.
function rolloverMonthlyBaseline(userId) {
  const b = db.prepare('SELECT revenue, sales_count, avg_order, baseline_month FROM businesses WHERE user_id = ?').get(userId);
  const currentMonth = new Date().toISOString().slice(0, 7); // "2026-07"
  if (b.baseline_month === currentMonth) return;
  db.prepare('UPDATE businesses SET baseline_revenue = ?, baseline_sales_count = ?, baseline_avg_order = ?, baseline_month = ? WHERE user_id = ?')
    .run(b.revenue, b.sales_count, b.avg_order, currentMonth, userId);
}

export function getBusiness(userId) {
  rolloverMonthlyBaseline(userId);
  const b = db.prepare('SELECT * FROM businesses WHERE user_id = ?').get(userId);
  const links = db.prepare('SELECT * FROM biz_links WHERE user_id = ? ORDER BY sort_order DESC').all(userId).map(rowToLink);
  const invoices = db.prepare('SELECT * FROM biz_invoices WHERE user_id = ? ORDER BY sort_order DESC').all(userId).map(rowToInvoice);
  const checkoutPages = db.prepare('SELECT * FROM biz_checkout_pages WHERE user_id = ? ORDER BY sort_order DESC').all(userId).map(rowToCheckoutPage);
  const team = db.prepare('SELECT * FROM biz_team WHERE user_id = ? ORDER BY sort_order ASC').all(userId).map(rowToTeamMember);
  const customers = db.prepare('SELECT * FROM biz_customers WHERE user_id = ? ORDER BY total DESC').all(userId).map(rowToCustomer);
  const transactions = db.prepare('SELECT * FROM biz_transactions WHERE user_id = ? ORDER BY sort_order DESC').all(userId).map(rowToBizTx);
  const payouts = db.prepare('SELECT * FROM biz_payouts WHERE user_id = ? ORDER BY sort_order DESC').all(userId).map(rowToPayout);
  return {
    revenue: b.revenue, salesCount: b.sales_count, avgOrder: b.avg_order,
    baseline: { revenue: b.baseline_revenue, salesCount: b.baseline_sales_count, avgOrder: b.baseline_avg_order },
    balance: { available: b.balance_available, pending: b.balance_pending },
    links, invoices, checkoutPages, team, customers, transactions, payouts,
  };
}

export function getNotifications(userId) {
  return db.prepare('SELECT * FROM notifications WHERE user_id = ? ORDER BY sort_order DESC').all(userId).map(rowToNotification);
}

export function addNotification(userId, title, body, kind = 'system') {
  const order = nextSortOrder('notifications', userId);
  db.prepare('INSERT INTO notifications (id, user_id, kind, title, body, date, read, sort_order) VALUES (?, ?, ?, ?, ?, ?, 0, ?)')
    .run(uid('ntf'), userId, kind, title, body, nowLabel(), order);
}
