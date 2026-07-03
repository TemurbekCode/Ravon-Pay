import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import { randomUUID } from 'node:crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

export const db = new DatabaseSync(path.join(DATA_DIR, 'ravonpay.db'));
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');

// ============================================
// SXEMA — mockStore.js dagi shakllarning to'g'ridan-to'g'ri server tomonidagi
// ekvivalenti. Har bir foydalanuvchi (users) uchun wallets/businesses qatori
// bittadan bo'ladi; qolganlari (cards, transactions, invoices va h.k.) ko'p qatorli.
// ============================================
db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  phone TEXT DEFAULT '',
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  company_name TEXT DEFAULT '',
  account_type TEXT NOT NULL DEFAULT 'personal',
  profiles TEXT NOT NULL DEFAULT '["personal"]',
  role TEXT NOT NULL DEFAULT 'user',
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS wallets (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  balance INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS cards (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  variant TEXT, type TEXT, num TEXT, exp TEXT, holder TEXT DEFAULT '',
  balance INTEGER DEFAULT 0, frozen INTEGER DEFAULT 0,
  sort_order INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS wallet_transactions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT, name TEXT, date TEXT, status TEXT, amount INTEGER,
  sort_order INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS contacts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  initials TEXT, name TEXT, phone TEXT, grad TEXT,
  sort_order INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS businesses (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  revenue INTEGER DEFAULT 0,
  sales_count INTEGER DEFAULT 0,
  avg_order INTEGER DEFAULT 0,
  baseline_revenue INTEGER DEFAULT 0,
  baseline_sales_count INTEGER DEFAULT 0,
  baseline_avg_order INTEGER DEFAULT 0,
  balance_available INTEGER DEFAULT 0,
  balance_pending INTEGER DEFAULT 0,
  subscription_active INTEGER DEFAULT 0,
  subscription_plan TEXT DEFAULT '',
  subscription_started_at TEXT DEFAULT '',
  baseline_month TEXT DEFAULT ''
);

CREATE TABLE IF NOT EXISTS biz_links (
  id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT, slug TEXT, uses INTEGER DEFAULT 0, amount INTEGER DEFAULT 0,
  sort_order INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS biz_invoices (
  id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  num TEXT, client TEXT, due TEXT, amount INTEGER DEFAULT 0, status TEXT DEFAULT 'pending',
  sort_order INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS biz_checkout_pages (
  id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT, slug TEXT, views INTEGER DEFAULT 0, active INTEGER DEFAULT 1,
  sort_order INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS biz_team (
  id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  initials TEXT, grad TEXT, name TEXT, email TEXT, role_key TEXT,
  sort_order INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS biz_customers (
  id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  initials TEXT, grad TEXT, name TEXT, email TEXT, orders INTEGER DEFAULT 0, total INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS biz_transactions (
  id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  initials TEXT, grad TEXT, name TEXT, email TEXT, mi TEXT, method TEXT,
  status TEXT, date TEXT, amount INTEGER, is_in INTEGER,
  sort_order INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS biz_payouts (
  id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT, date TEXT, amount INTEGER, status TEXT,
  sort_order INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind TEXT, title TEXT, body TEXT, date TEXT, read INTEGER DEFAULT 0,
  sort_order INTEGER DEFAULT 0
);

-- Payme/Click kabi haqiqiy to'lov provayderlari webhook orqali xabar bergan
-- tranzaksiyalarning holatini kuzatish uchun (id = provayderning o'z tranzaksiya
-- raqami). state: 1=yaratildi/kutilmoqda, 2=amalga oshirildi/to'landi,
-- -1=bekor qilindi(hali to'lanmagan), -2=bekor qilindi(to'langandan keyin).
CREATE TABLE IF NOT EXISTS provider_transactions (
  id TEXT PRIMARY KEY,
  provider TEXT NOT NULL,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  order_id TEXT NOT NULL,
  amount INTEGER NOT NULL,
  state INTEGER DEFAULT 1,
  create_time INTEGER,
  perform_time INTEGER DEFAULT 0,
  cancel_time INTEGER DEFAULT 0,
  reason INTEGER
);
`);

// Himoya migratsiyasi — agar "businesses" jadvali oldingi versiyadan (obuna
// ustunlarisiz) qolgan bo'lsa, mavjud ma'lumotlarni yo'qotmasdan qo'shib qo'yadi.
for (const col of ['subscription_active INTEGER DEFAULT 0', 'subscription_plan TEXT DEFAULT \'\'', 'subscription_started_at TEXT DEFAULT \'\'', 'baseline_month TEXT DEFAULT \'\'']) {
  try { db.exec(`ALTER TABLE businesses ADD COLUMN ${col}`); } catch { /* ustun allaqachon mavjud */ }
}
try { db.exec("ALTER TABLE cards ADD COLUMN holder TEXT DEFAULT ''"); } catch { /* ustun allaqachon mavjud */ }

// Founder/CEO hisobi — biznes dashboard uchun to'lov (obuna) talab qilinmaydi,
// har doim bepul va cheklovsiz foydalanadi. Bu HAQIQIY hisob (o'z paroli bilan
// ro'yxatdan o'tadi, ma'lumoti noldan boshlanadi) — CEO demo hisobi kabi
// soxta parolsiz kirish yoki boy namunaviy ma'lumot bilan boshlamaydi.
export const FOUNDER_EMAIL = 'ravonpay@gmail.com';
export function isFounder(email) {
  return (email || '').trim().toLowerCase() === FOUNDER_EMAIL;
}

let seedCounter = 0;
export function uid(prefix = 'id') {
  seedCounter += 1;
  return `${prefix}-${Date.now()}-${seedCounter}-${randomUUID().slice(0, 6)}`;
}

export function nowLabel() {
  const d = new Date();
  return `Hozir, ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function insertMany(table, columns, rows) {
  const placeholders = columns.map(() => '?').join(', ');
  const stmt = db.prepare(`INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`);
  rows.forEach((row) => stmt.run(...row));
}

// Yangi ro'yxatdan o'tgan foydalanuvchi uchun — hamma narsa NOLDAN boshlanadi.
export function seedEmptyWalletAndBusiness(userId, fullName, email) {
  db.prepare('INSERT INTO wallets (user_id, balance) VALUES (?, 0)').run(userId);
  db.prepare(`INSERT INTO businesses (user_id, revenue, sales_count, avg_order, baseline_revenue, baseline_sales_count, baseline_avg_order, balance_available, balance_pending, baseline_month)
    VALUES (?, 0, 0, 0, 0, 0, 0, 0, 0, ?)`).run(userId, new Date().toISOString().slice(0, 7));
  const ownerInitials = fullName.split(' ').map((p) => p[0]).filter(Boolean).slice(0, 2).join('').toUpperCase() || 'S';
  db.prepare('INSERT INTO biz_team (id, user_id, initials, grad, name, email, role_key, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, 0)')
    .run(uid('tm'), userId, ownerInitials, '#6366F1,#8B5CF6', fullName, email, 'team.owner');
  db.prepare('INSERT INTO notifications (id, user_id, kind, title, body, date, read, sort_order) VALUES (?, ?, ?, ?, ?, ?, 0, 0)')
    .run(uid('ntf'), userId, 'system', "RavonPay'ga xush kelibsiz!", "Kartangizni ulang va birinchi to'lovingizni amalga oshiring — barcha xabarlar shu yerda ko'rinadi.", nowLabel());
}

