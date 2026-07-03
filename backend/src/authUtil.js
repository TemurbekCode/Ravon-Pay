import jwt from 'jsonwebtoken';
import { randomBytes } from 'node:crypto';

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

export function signToken(userId) {
  return jwt.sign({ sub: userId }, JWT_SECRET, { expiresIn: '30d' });
}

export function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET).sub;
}
