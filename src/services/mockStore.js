// ============================================
// MOCK MA'LUMOTLAR OMBORI (backend ulanmagunча)
// Faqat service fayllari (paymentService, cardService, businessService)
// o'zining catch(networkError) blokidan shu modulni chaqiradi.
// Backend tayyor bo'lganda: shu fayl va uni chaqiruvchi catch bloklari o'chiriladi.
//
// Ma'lumotlar HAR BIR FOYDALANUVCHI (email) uchun ALOHIDA saqlanadi va HAMMASI
// NOLDAN (bo'sh hamyon/biznes) boshlaydi.
// ============================================

import { FOUNDER_EMAIL } from '../utils/constants.js';
import { formatCurrency } from '../utils/formatCurrency.js';
import { detectCardType, isCardFormValid } from '../utils/cardValidation.js';

function uid(prefix = 'id') {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

function nowLabel() {
  const d = new Date();
  return `Hozir, ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

// Joriy tizimga kirgan foydalanuvchini (authService tomonidan saqlangan) o'qiydi —
// shu orqali har bir hisobning hamyon/biznes ma'lumoti bir-biridan ajratiladi.
function currentUser() {
  try {
    const raw = localStorage.getItem('ravonpay_mock_user');
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return null;
}

function profileKey() {
  const u = currentUser();
  const id = u?.phone || u?.email || 'guest';
  return id.trim().toLowerCase().replace(/[^a-z0-9]/g, '_');
}

function isFounderProfile() {
  return (currentUser()?.email || '').trim().toLowerCase() === FOUNDER_EMAIL;
}

function walletKey() { return `ravonpay_mock_wallet_${profileKey()}`; }
function businessKey() { return `ravonpay_mock_business_${profileKey()}`; }
function notificationsKey() { return `ravonpay_mock_notifications_${profileKey()}`; }

// ---------- BILDIRISHNOMALAR (SMS/push xabarlar) ----------
// Pul yechilsa/tushsa yoki RavonPay tomonidan umumiy e'lon chiqarilsa,
// shu yerga real vaqtda yangi bildirishnoma qo'shiladi.

function seedNotifications() {
  return [
    { id: uid('ntf'), kind: 'system', title: "RavonPay'ga xush kelibsiz!", body: "Kartangizni ulang va birinchi to'lovingizni amalga oshiring — barcha xabarlar shu yerda ko'rinadi.", date: nowLabel(), read: false },
  ];
}

function readNotifications() {
  const raw = localStorage.getItem(notificationsKey());
  if (raw) { try { return JSON.parse(raw); } catch { /* fall through to reseed */ } }
  const seeded = seedNotifications();
  localStorage.setItem(notificationsKey(), JSON.stringify(seeded));
  return seeded;
}

function writeNotifications(list) {
  localStorage.setItem(notificationsKey(), JSON.stringify(list));
  return list;
}

function getNotifications() {
  return readNotifications();
}

function addNotification(title, body, kind = 'system') {
  const list = readNotifications();
  const notif = { id: uid('ntf'), kind, title, body, date: nowLabel(), read: false };
  return writeNotifications([notif, ...list]);
}

function markAllNotificationsRead() {
  const list = readNotifications().map((n) => ({ ...n, read: true }));
  return writeNotifications(list);
}

// ---------- SEED: yangi ro'yxatdan o'tgan hisob (bo'sh, noldan boshlaydi) ----------

function seedWalletEmpty() {
  return { balance: 0, cards: [], transactions: [], contacts: [] };
}

function currentMonthKey() {
  return new Date().toISOString().slice(0, 7); // "2026-07"
}

function seedBusinessEmpty() {
  const u = currentUser();
  const ownerName = u?.fullName || 'Siz';
  return {
    revenue: 0,
    salesCount: 0,
    avgOrder: 0,
    baseline: { revenue: 0, salesCount: 0, avgOrder: 0 },
    baselineMonth: currentMonthKey(),
    balance: { available: 0, pending: 0 },
    links: [],
    invoices: [],
    checkoutPages: [],
    team: [{
      id: 'tm-owner',
      initials: ownerName.split(' ').map((p) => p[0]).filter(Boolean).slice(0, 2).join('').toUpperCase() || 'S',
      grad: '#6366F1,#8B5CF6',
      name: ownerName,
      email: u?.email || '',
      roleKey: 'team.owner',
    }],
    customers: [],
    transactions: [],
    payouts: [],
    // Biznes dashboard obunasi — founder har doim bepul, boshqalar to'lov qilishi kerak.
    subscriptionActive: isFounderProfile(),
    subscriptionPlan: '',
    verification: { status: 'none', taxId: '', legalAddress: '' },
  };
}

// ---------- READ/WRITE ----------

function readWallet() {
  const raw = localStorage.getItem(walletKey());
  if (raw) { try { return JSON.parse(raw); } catch { /* fall through to reseed */ } }
  const seeded = seedWalletEmpty();
  localStorage.setItem(walletKey(), JSON.stringify(seeded));
  return seeded;
}

function writeWallet(state) {
  localStorage.setItem(walletKey(), JSON.stringify(state));
  return state;
}

// Har oy boshida "baseline" joriy ko'rsatkichlarga qayta o'rnatiladi — shu
// orqali KPI foizlari "shu oy boshidan beri o'sish"ni ko'rsatadi (backend'dagi
// rolloverMonthlyBaseline bilan bir xil qoida).
function readBusiness() {
  const raw = localStorage.getItem(businessKey());
  let parsed = null;
  if (raw) {
    try {
      parsed = JSON.parse(raw);
      // Eski (baseline maydonisiz) saqlangan holatlarni migratsiya qilish.
      if (!parsed.baseline) {
        parsed.baseline = { revenue: parsed.revenue, salesCount: parsed.salesCount, avgOrder: parsed.avgOrder };
      }
      if (parsed.subscriptionActive === undefined) parsed.subscriptionActive = isFounderProfile();
      if (!parsed.verification) parsed.verification = { status: 'none', taxId: '', legalAddress: '' };
    } catch { /* fall through to reseed */ }
  }
  if (!parsed) parsed = seedBusinessEmpty();

  const month = currentMonthKey();
  if (parsed.baselineMonth !== month) {
    parsed.baseline = { revenue: parsed.revenue, salesCount: parsed.salesCount, avgOrder: parsed.avgOrder };
    parsed.baselineMonth = month;
  }
  writeBusiness(parsed);
  return parsed;
}

function writeBusiness(state) {
  localStorage.setItem(businessKey(), JSON.stringify(state));
  return state;
}

function clearAll() {
  localStorage.removeItem(walletKey());
  localStorage.removeItem(businessKey());
  localStorage.removeItem(notificationsKey());
  // Eski (profilga bog'lanmagan) kalitlarni ham tozalash — avvalgi versiyadan qolgan bo'lishi mumkin.
  localStorage.removeItem('ravonpay_mock_wallet');
  localStorage.removeItem('ravonpay_mock_business');
}

// ---------- WALLET DOMAIN FUNCTIONS ----------

function getWallet() {
  return readWallet();
}

function getBalance() {
  return readWallet().balance;
}

function getCards() {
  return readWallet().cards;
}

function getTransactions() {
  return readWallet().transactions;
}

function getContacts() {
  return readWallet().contacts;
}

function applyTopUp(amount) {
  const w = readWallet();
  w.balance += amount;
  w.transactions = [{ id: uid('tx'), type: 'in', name: "Hamyon to'ldirildi", date: nowLabel(), status: 'done', amount }, ...w.transactions];
  writeWallet(w);
  addNotification("Hamyon to'ldirildi", `+${formatCurrency(amount)} so'm hamyoningizga tushdi. Balans: ${formatCurrency(w.balance)} so'm`, 'in');
  return { ...w, notifications: getNotifications() };
}

function applyWithdraw(amount, cardId) {
  const w = readWallet();
  if (amount > w.balance) throw new Error('INSUFFICIENT_BALANCE');
  const card = w.cards.find((c) => c.id === cardId);
  if (!card) throw new Error('INVALID_CARD');
  w.balance -= amount;
  w.transactions = [{ id: uid('tx'), type: 'out', name: `${card.num} kartasiga yechildi`, date: nowLabel(), status: 'done', amount: -amount }, ...w.transactions];
  writeWallet(w);
  addNotification('Pul yechildi', `-${formatCurrency(amount)} so'm ${card.num} kartangizga yechib olindi. Balans: ${formatCurrency(w.balance)} so'm`, 'out');
  return { ...w, notifications: getNotifications() };
}

function applySend(recipient, amount) {
  const w = readWallet();
  if (amount > w.balance) throw new Error('INSUFFICIENT_BALANCE');
  w.balance -= amount;
  w.transactions = [{ id: uid('tx'), type: 'out', name: `${recipient} ga o'tkazma`, date: nowLabel(), status: 'done', amount: -amount }, ...w.transactions];
  writeWallet(w);
  addNotification('Pul yuborildi', `${recipient}ga ${formatCurrency(amount)} so'm yuborildi. Balans: ${formatCurrency(w.balance)} so'm`, 'out');
  return { ...w, notifications: getNotifications() };
}

function applyUtilityPayment(category, account, amount) {
  const w = readWallet();
  if (amount > w.balance) throw new Error('INSUFFICIENT_BALANCE');
  w.balance -= amount;
  w.transactions = [{ id: uid('tx'), type: 'out', name: `Kommunal to'lov — ${category} (${account})`, date: nowLabel(), status: 'done', amount: -amount }, ...w.transactions];
  writeWallet(w);
  addNotification("To'lov amalga oshirildi", `${category} uchun ${formatCurrency(amount)} so'm to'landi`, 'out');
  return { ...w, notifications: getNotifications() };
}

// Foydalanuvchi kiritgan haqiqiy karta ma'lumotlarini tekshiradi va faqat
// maskalangan raqamni saqlaydi (backend'dagi /cards bilan bir xil qoida).
function addCard(data) {
  if (!isCardFormValid(data)) throw new Error('INVALID_CARD');
  const digits = data.cardNumber.replace(/\D/g, '');
  const w = readWallet();
  const variant = w.cards.length % 2 === 0 ? 'v1' : 'v2';
  const card = {
    id: uid('card'),
    variant,
    type: detectCardType(data.cardNumber),
    num: `${digits.slice(0, 4)} •••• •••• ${digits.slice(-4)}`,
    exp: data.expiry,
    holder: data.cardholderName.trim(),
    balance: 0,
    frozen: false,
  };
  w.cards = [...w.cards, card];
  writeWallet(w);
  return card;
}

function toggleFreezeCard(id) {
  const w = readWallet();
  w.cards = w.cards.map((c) => (c.id === id ? { ...c, frozen: !c.frozen } : c));
  return writeWallet(w);
}

function removeCard(id) {
  const w = readWallet();
  w.cards = w.cards.filter((c) => c.id !== id);
  return writeWallet(w);
}

function addContact(name, phone) {
  const w = readWallet();
  const grads = ['linear-gradient(135deg,#F59E0B,#EF4444)', 'linear-gradient(135deg,#10B981,#22D3EE)', 'linear-gradient(135deg,#8B5CF6,#6366F1)', 'linear-gradient(135deg,#EC4899,#8B5CF6)'];
  const contact = {
    id: uid('c'),
    initials: name.split(' ').map((p) => p[0]).filter(Boolean).slice(0, 2).join('').toUpperCase(),
    name,
    phone,
    grad: grads[w.contacts.length % grads.length],
  };
  w.contacts = [...w.contacts, contact];
  writeWallet(w);
  return contact;
}

// ---------- BUSINESS DOMAIN FUNCTIONS ----------

function getBusiness() {
  return readBusiness();
}

const PLAN_LABELS = { monthly: 'Oylik', yearly: 'Yillik' };

function getSubscription() {
  const b = readBusiness();
  return { active: !!b.subscriptionActive, plan: b.subscriptionPlan || '', founder: isFounderProfile() };
}

// To'lov uchun haqiqiy karta talab qilinadi — mavjud kartani (cardId) tanlash
// yoki yangi karta ma'lumotlarini kiritish orqali (backend'dagi /subscribe bilan bir xil qoida).
function subscribe(plan, cardPayload) {
  const w = readWallet();
  let card;
  if (cardPayload?.cardId) {
    card = w.cards.find((c) => c.id === cardPayload.cardId);
    if (!card) throw new Error('INVALID_CARD');
  } else {
    card = addCard({ ...cardPayload, cvv: '000' });
  }
  const b = readBusiness();
  b.subscriptionActive = true;
  b.subscriptionPlan = plan;
  writeBusiness(b);
  addNotification('Obuna faollashtirildi', `${PLAN_LABELS[plan] || plan} reja bo'yicha ${card.num} kartasidan to'lov muvaffaqiyatli amalga oshirildi. Biznes paneliga xush kelibsiz!`, 'system');
  addNotification("Biznes ma'lumotlaringizni to'ldiring", "STIR va yuridik manzilingizni qo'shing — bu hisobingiz ishonchliligini oshiradi. Sozlamalar bo'limidan istalgan vaqtda qo'shishingiz mumkin.", 'bizinfo');
  return { active: true, plan, founder: isFounderProfile(), card: cardPayload?.cardId ? undefined : card };
}

function updateBizVerification(taxId, legalAddress) {
  const b = readBusiness();
  b.verification = { status: 'pending', taxId, legalAddress };
  writeBusiness(b);
  return { verification: b.verification };
}

function applyBizWithdraw(amount, cardId) {
  const w = readWallet();
  const card = w.cards.find((c) => c.id === cardId);
  if (!card) throw new Error('INVALID_CARD');
  const b = readBusiness();
  if (amount > b.balance.available) throw new Error('INSUFFICIENT_BALANCE');
  b.balance = { ...b.balance, available: b.balance.available - amount };
  b.payouts = [{ id: uid('po'), name: `${card.num} kartasiga`, date: nowLabel(), amount: -amount, status: 'pending' }, ...b.payouts];
  writeBusiness(b);
  addNotification('Yechib olish so\'rovi', `${formatCurrency(amount)} so'm ${card.num} kartangizga yechib olinmoqda`, 'out');
  return { ...b, notifications: getNotifications() };
}

function applyBizUtilityPayment(category, account, amount) {
  const b = readBusiness();
  if (amount > b.balance.available) throw new Error('INSUFFICIENT_BALANCE');
  b.balance = { ...b.balance, available: b.balance.available - amount };
  b.transactions = [
    { id: uid('btx'), initials: 'UT', grad: '#F59E0B,#EF4444', name: "Kommunal to'lov", email: account, mi: '', method: category, status: 'done', date: nowLabel(), amount: -amount, in: false },
    ...b.transactions,
  ];
  writeBusiness(b);
  addNotification("To'lov amalga oshirildi", `${category} uchun ${formatCurrency(amount)} so'm to'landi`, 'out');
  return { ...b, notifications: getNotifications() };
}

function addLink(title, amount) {
  const b = readBusiness();
  const link = { id: uid('lnk'), title, slug: title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 24) || uid('l'), uses: 0, amount: Number(amount) || 0 };
  b.links = [link, ...b.links];
  writeBusiness(b);
  return link;
}

function addInvoice(client, due, amount) {
  const b = readBusiness();
  const nextNum = 1043 + b.invoices.length;
  const invoice = { id: uid('inv'), num: `INV-${nextNum}`, client, due, amount: Number(amount) || 0, status: 'pending' };
  b.invoices = [invoice, ...b.invoices];
  writeBusiness(b);
  return invoice;
}

// Mijoz to'lov qilganda — mavjud mijoz bo'lsa buyurtma/summasini oshiradi,
// yangi mijoz bo'lsa ro'yxatga qo'shadi (Top mijozlar shu orqali o'sadi).
function upsertCustomer(b, name, amount) {
  const grads = ['#10B981,#22D3EE', '#F59E0B,#EF4444', '#EC4899,#8B5CF6', '#8B5CF6,#6366F1', '#06B6D4,#3B82F6'];
  const existing = b.customers.find((c) => c.name.toLowerCase() === name.toLowerCase());
  if (existing) {
    existing.orders += 1;
    existing.total += amount;
  } else {
    b.customers = [...b.customers, {
      id: uid('cus'),
      initials: name.split(' ').map((p) => p[0]).filter(Boolean).slice(0, 2).join('').toUpperCase(),
      grad: grads[b.customers.length % grads.length],
      name,
      email: `${name.toLowerCase().replace(/\s+/g, '.')}@email.com`,
      orders: 1,
      total: amount,
    }];
  }
  b.customers.sort((a, c) => c.total - a.total);
}

// Faktura "to'landi" deb belgilansa — bu haqiqiy savdo hisoblanadi:
// daromad, sotuvlar soni, balans va mijoz ro'yxati (Top mijozlar) oshadi,
// o'rtacha chek qayta hisoblanadi.
function markInvoicePaid(id) {
  const b = readBusiness();
  const invoice = b.invoices.find((i) => i.id === id);
  if (!invoice || invoice.status === 'done') return { ...b, notifications: getNotifications() };
  invoice.status = 'done';
  b.revenue += invoice.amount;
  b.salesCount += 1;
  b.avgOrder = Math.round(b.revenue / b.salesCount);
  b.balance = { ...b.balance, available: b.balance.available + invoice.amount };
  b.transactions = [
    { id: uid('btx'), initials: invoice.client.slice(0, 2).toUpperCase(), grad: '#6366F1,#8B5CF6', name: invoice.client, email: '', mi: '', method: invoice.num, status: 'done', date: nowLabel(), amount: invoice.amount, in: true },
    ...b.transactions,
  ];
  upsertCustomer(b, invoice.client, invoice.amount);
  writeBusiness(b);
  addNotification('Yangi to\'lov qabul qilindi', `${invoice.client}: +${formatCurrency(invoice.amount)} so'm`, 'in');
  return { ...b, notifications: getNotifications() };
}

function addCheckoutPage(title) {
  const b = readBusiness();
  const page = { id: uid('chk'), title, slug: title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 24) || uid('p'), views: 0, active: true };
  b.checkoutPages = [page, ...b.checkoutPages];
  writeBusiness(b);
  return page;
}

function toggleCheckoutPage(id) {
  const b = readBusiness();
  b.checkoutPages = b.checkoutPages.map((p) => (p.id === id ? { ...p, active: !p.active } : p));
  return writeBusiness(b);
}

function addTeamMember(email, role) {
  const b = readBusiness();
  const grads = ['#6366F1,#8B5CF6', '#10B981,#22D3EE', '#EC4899,#8B5CF6', '#06B6D4,#3B82F6'];
  const member = {
    id: uid('tm'),
    initials: email.slice(0, 2).toUpperCase(),
    grad: grads[b.team.length % grads.length],
    name: email.split('@')[0],
    email,
    roleKey: role === 'admin' ? 'team.admin' : 'team.member',
  };
  b.team = [...b.team, member];
  writeBusiness(b);
  return member;
}

export const mockStore = {
  clearAll,
  getWallet, getBalance, getCards, getTransactions, getContacts,
  applyTopUp, applyWithdraw, applySend, applyUtilityPayment,
  addCard, toggleFreezeCard, removeCard, addContact,
  getBusiness, applyBizWithdraw, applyBizUtilityPayment, addLink, addInvoice, addCheckoutPage, toggleCheckoutPage, addTeamMember, markInvoicePaid,
  getNotifications, markAllNotificationsRead,
  getSubscription, subscribe, updateBizVerification,
};
