import { createClient } from '@libsql/client';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import { randomUUID } from 'node:crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const DATA_DIR = path.join(__dirname, '..', 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

// Lokal ishlab chiqishda oddiy fayl (node:sqlite bilan bir xil joyda), production'da
// TURSO_DATABASE_URL/TURSO_AUTH_TOKEN sozlansa — xuddi shu kod bulutdagi Turso
// (SQLite-mos, bepul) bazasiga ulanadi. Kodni o'zgartirish shart emas.
const client = createClient({
  url: process.env.TURSO_DATABASE_URL || `file:${path.join(DATA_DIR, 'ravonpay.db')}`,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

// node:sqlite'ning DatabaseSync.prepare(sql).get/all/run(...) shakliga mos,
// lekin libSQL mijozi tarmoq orqali ishlaganligi uchun HAR DOIM asinxron
// (Promise qaytaradi) — chaqiruvchi tomonda "await" qo'shish YETARLI, boshqa
// hech narsa o'zgarmaydi.
function prepare(sql) {
  return {
    get: async (...args) => {
      const res = await client.execute({ sql, args });
      return res.rows[0];
    },
    all: async (...args) => {
      const res = await client.execute({ sql, args });
      return res.rows;
    },
    run: async (...args) => {
      const res = await client.execute({ sql, args });
      return { lastInsertRowid: Number(res.lastInsertRowid ?? 0), changes: res.rowsAffected };
    },
  };
}

// Bir nechta yozuvni BITTA atomik tranzaksiyada bajaradi — barchasi yoki
// hech biri. Pul harakatlanadigan ko'p qadamli amallar (masalan P2P: jo'natuvchidan
// yechish + qabul qiluvchiga qo'shish) uchun shart, aks holda ikkinchi qadamdan
// oldin server xato bersa pul "yo'qolib qolishi" mumkin edi.
export async function withTransaction(fn) {
  const tx = await client.transaction('write');
  try {
    const wrapped = {
      execute: async (sql, args = []) => {
        const res = await tx.execute({ sql, args });
        return { lastInsertRowid: Number(res.lastInsertRowid ?? 0), changes: res.rowsAffected, rows: res.rows };
      },
    };
    const result = await fn(wrapped);
    await tx.commit();
    return result;
  } catch (err) {
    await tx.rollback().catch(() => {});
    throw err;
  } finally {
    tx.close();
  }
}

export const db = {
  prepare,
  exec: (sql) => client.executeMultiple(sql),
};

// `ALTER TABLE ... ADD COLUMN` avval ustun mavjudligini ANIQ tekshiradi (PRAGMA
// orqali), keyin qo'shadi. Ilgari "try/catch, xatoni jimgina yutish" naqshi
// ishlatilgan edi — bu ustun ALLAQACHON borligidan boshqa har qanday sababdan
// (masalan uzoqdagi Turso'da kutilmagan xatolik) ALTER muvaffaqiyatsiz bo'lsa ham
// buni butunlay yashirib, keyinchalik shu ustunga yozishga urinilganda "no such
// column" bilan boshqa joyda (masalan ro'yxatdan o'tishda) portlab ketishiga olib
// kelardi — aynan shu sabab production'da ro'yxatdan o'tish butunlay ishlamay
// qolishiga sabab bo'lgan edi.
async function ensureColumn(table, columnDef) {
  const columnName = columnDef.trim().split(/\s+/)[0];
  try {
    const info = await client.execute(`PRAGMA table_info(${table})`);
    if (info.rows.some((c) => c.name === columnName)) return;
    await client.execute(`ALTER TABLE ${table} ADD COLUMN ${columnDef}`);
  } catch (err) {
    console.error(`[db migratsiya] ${table}.${columnName} qo'shib bo'lmadi:`, err);
  }
}

try { await client.execute('PRAGMA foreign_keys = ON;'); } catch { /* remote Turso'da PRAGMA kerak emas */ }

// ESLATMA: bu yerda ilgari eski sxemadan (email majburiy, parol bilan kirish
// davridan qolgan) yangi sxemaga bir martalik o'tish mantiqi bor edi (users
// jadvalini users_old_migration'ga rename qilib, qayta qurib, ma'lumotni
// ko'chirib, keyin eskisini DROP qiladigan). Ishlab turgan bazada bu o'tish
// allaqachon KO'PDAN BERI muvaffaqiyatli yakunlangan (email ustuni allaqachon
// ixtiyoriy) — lekin bu tekshiruv HAR SERVER ishga tushishida (Render bepul
// tarifida bu tez-tez, har "uyg'onish"da) qayta bajarilardi. Bepul hostingda
// server tez-tez qayta ishga tushishi bilan bog'liq bo'lgan, aniq sababi to'liq
// tasdiqlanmagan holatda, xuddi shu DROP TABLE users_old_migration'ga oid
// "no such table" xatosi ro'yxatdan o'tishni butunlay to'xtatib qo'ygan edi —
// vazifasi allaqachon bajarilgan, hozirgi bazaga umuman kerak bo'lmagan shu
// bir martalik kod butunlay olib tashlandi.

// ============================================
// SXEMA — mockStore.js dagi shakllarning to'g'ridan-to'g'ri server tomonidagi
// ekvivalenti. Har bir foydalanuvchi (users) uchun wallets/businesses qatori
// bittadan bo'ladi; qolganlari (cards, transactions, invoices va h.k.) ko'p qatorli.
// ============================================
await client.executeMultiple(`
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE,
  phone TEXT UNIQUE NOT NULL,
  password_hash TEXT DEFAULT '',
  full_name TEXT NOT NULL,
  company_name TEXT DEFAULT '',
  account_type TEXT NOT NULL DEFAULT 'personal',
  profiles TEXT NOT NULL DEFAULT '["personal"]',
  role TEXT NOT NULL DEFAULT 'user',
  created_at TEXT NOT NULL
);

-- Telefon raqamiga yuborilgan SMS tasdiqlash kodi — ro'yxatdan o'tish va
-- kirish uchun ham ishlatiladi (parol o'rniga). Har bir telefon uchun faqat
-- bitta faol kod bo'ladi (yangisi so'ralsa eskisi almashtiriladi).
CREATE TABLE IF NOT EXISTS otp_codes (
  phone TEXT PRIMARY KEY,
  code TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  attempts INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS wallets (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  balance INTEGER NOT NULL DEFAULT 0,
  baseline_balance INTEGER NOT NULL DEFAULT 0,
  baseline_month TEXT NOT NULL DEFAULT ''
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

-- Access token endi qisqa muddatli (1 soat) — foydalanuvchi doimiy kirgan
-- holda qolishi uchun uzoqroq (30 kun) "refresh" tokeni shu jadvalda saqlanadi
-- va HAR DOIM bazadan tekshiriladi, shuning uchun chiqish (logout) yoki
-- shubhali holatda darhol bekor qilish (revoke) mumkin — sof JWT'dan farqli
-- o'laroq, imzosi to'g'ri bo'lsa ham bazada bo'lmasa endi ishlamaydi.
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  revoked INTEGER DEFAULT 0
);
`);

// Himoya migratsiyasi — agar "businesses" jadvali oldingi versiyadan (obuna
// ustunlarisiz) qolgan bo'lsa, mavjud ma'lumotlarni yo'qotmasdan qo'shib qo'yadi.
for (const col of ['subscription_active INTEGER DEFAULT 0', 'subscription_plan TEXT DEFAULT \'\'', 'subscription_started_at TEXT DEFAULT \'\'', 'baseline_month TEXT DEFAULT \'\'', 'tax_id TEXT DEFAULT \'\'', 'legal_address TEXT DEFAULT \'\'', 'verification_status TEXT DEFAULT \'none\'', 'document_path TEXT DEFAULT \'\'', 'document_uploaded_at TEXT DEFAULT \'\'']) {
  await ensureColumn('businesses', col);
}
await ensureColumn('cards', "holder TEXT DEFAULT ''");
await ensureColumn('users', 'two_fa_enabled INTEGER DEFAULT 0');
await ensureColumn('wallets', 'baseline_balance INTEGER NOT NULL DEFAULT 0');
await ensureColumn('wallets', "baseline_month TEXT NOT NULL DEFAULT ''");

// Admin panelga kirish huquqi — founder email'i har doim 'admin' bo'lishi kerak,
// hisob qachon yoki qaysi usulda (telefon/Google) ro'yxatdan o'tganidan qat'i nazar.
await client.execute("UPDATE users SET role = 'admin' WHERE LOWER(email) = 'ravonpay@gmail.com' AND role != 'admin'");

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

// Yangi ro'yxatdan o'tgan foydalanuvchi uchun — hamma narsa NOLDAN boshlanadi.
export async function seedEmptyWalletAndBusiness(userId, fullName, email) {
  await db.prepare('INSERT INTO wallets (user_id, balance, baseline_balance, baseline_month) VALUES (?, 0, 0, ?)').run(userId, new Date().toISOString().slice(0, 7));
  await db.prepare(`INSERT INTO businesses (user_id, revenue, sales_count, avg_order, baseline_revenue, baseline_sales_count, baseline_avg_order, balance_available, balance_pending, baseline_month)
    VALUES (?, 0, 0, 0, 0, 0, 0, 0, 0, ?)`).run(userId, new Date().toISOString().slice(0, 7));
  const ownerInitials = fullName.split(' ').map((p) => p[0]).filter(Boolean).slice(0, 2).join('').toUpperCase() || 'S';
  await db.prepare('INSERT INTO biz_team (id, user_id, initials, grad, name, email, role_key, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, 0)')
    .run(uid('tm'), userId, ownerInitials, '#6366F1,#8B5CF6', fullName, email, 'team.owner');
  await db.prepare('INSERT INTO notifications (id, user_id, kind, title, body, date, read, sort_order) VALUES (?, ?, ?, ?, ?, ?, 0, 0)')
    .run(uid('ntf'), userId, 'system', "RavonPay'ga xush kelibsiz!", "Kartangizni ulang va birinchi to'lovingizni amalga oshiring — barcha xabarlar shu yerda ko'rinadi.", nowLabel());
}
