import jwt from 'jsonwebtoken';
import { randomBytes } from 'node:crypto';
import { db, uid } from './db.js';

// GitHub'da ko'rinishi mumkin bo'lgan hardcoded/bashorat qilinadigan kalitdan qochish uchun:
// .env'da JWT_SECRET bo'lsa o'shani ishlatadi; bo'lmasa har server ishga tushganda
// tasodifiy vaqtinchalik kalit yaratadi (bu holatda qayta ishga tushirilganda eski
// sessiyalar bekor bo'ladi — buni oldini olish uchun .env.example'ga qarab JWT_SECRET
// qo'ying).
let secret = process.env.JWT_SECRET;
if (!secret) {
  secret = randomBytes(48).toString('hex');
  console.warn('\n⚠️  JWT_SECRET .env faylida topilmadi — tasodifiy vaqtinchalik kalit ishlatilmoqda.');
  console.warn('   Server qayta ishga tushirilganda barcha sessiyalar (tokenlar) bekor bo\'ladi.');
  console.warn('   Doimiy ishlash uchun backend/.env fayliga JWT_SECRET=... qo\'shing (backend/.env.example\'ga qarang).\n');
}

export const JWT_SECRET = secret;

// Access token endi QISQA muddatli (1 soat) — token o'g'irlansa ham tez
// eskiradi. Foydalanuvchi 30 kun davomida qayta kirmasdan ishlashi uchun
// alohida "refresh" tokeni bor (db.js'dagi refresh_tokens jadvaliga qarang) —
// u har doim bazadan tekshiriladi, shuning uchun chiqishda/shubhali holatda
// darhol bekor qilish mumkin (sof JWT'da bu imkonsiz edi).
export function signAccessToken(userId) {
  return jwt.sign({ sub: userId }, JWT_SECRET, { expiresIn: '1h' });
}

export function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET).sub;
}

const REFRESH_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 kun

// Kirish/ro'yxatdan o'tishda ikkalasi ham beriladi: qisqa muddatli accessToken
// (har so'rovda ishlatiladi) va bazada saqlangan, 30 kunlik refreshToken.
export async function issueTokens(userId) {
  const accessToken = signAccessToken(userId);
  const refreshToken = uid('rt');
  await db.prepare('INSERT INTO refresh_tokens (id, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)')
    .run(refreshToken, userId, Date.now() + REFRESH_TTL_MS, Date.now());
  return { accessToken, refreshToken };
}

// Refresh oqimi HAR DOIM eski tokenni bekor qilib, yangisini beradi (rotatsiya) —
// shu orqali o'g'irlangan (lekin hali ishlatilmagan) eski refresh tokeni keyinroq
// qayta ishlatilsa (replay), darhol payqash mumkin bo'ladi.
export async function rotateRefreshToken(oldToken) {
  const row = await db.prepare('SELECT * FROM refresh_tokens WHERE id = ?').get(oldToken);
  if (!row || row.revoked || row.expires_at < Date.now()) return null;
  await db.prepare('UPDATE refresh_tokens SET revoked = 1 WHERE id = ?').run(oldToken);
  return issueTokens(row.user_id);
}

export async function revokeRefreshToken(token) {
  await db.prepare('UPDATE refresh_tokens SET revoked = 1 WHERE id = ?').run(token);
}
