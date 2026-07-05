import './src/env.js'; // BIRINCHI import bo'lishi shart — boshqa modullar process.env'ni o'qishidan oldin .env yuklanadi

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { randomUUID } from 'node:crypto';
import './src/db.js';
import { requestLogger } from './src/middleware/requestLogger.js';

import authRoutes from './src/routes/auth.routes.js';
import cardsRoutes from './src/routes/cards.routes.js';
import walletRoutes from './src/routes/wallet.routes.js';
import transactionsRoutes from './src/routes/transactions.routes.js';
import contactsRoutes from './src/routes/contacts.routes.js';
import utilitiesRoutes from './src/routes/utilities.routes.js';
import paymentsRoutes from './src/routes/payments.routes.js';
import businessRoutes from './src/routes/business.routes.js';
import adminRoutes from './src/routes/admin.routes.js';
import notificationsRoutes from './src/routes/notifications.routes.js';
import webhooksRoutes from './src/routes/webhooks.routes.js';

const app = express();
const PORT = process.env.PORT || 4000;
const corsOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173').split(',').map((s) => s.trim());

app.use(helmet());
app.use(cors({ origin: corsOrigins }));
app.use(requestLogger);
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true })); // Click webhook'i form-urlencoded yuborishi mumkin

// Butun API bo'ylab umumiy himoya — auth.routes.js'dagi bruteForceLimiter bunga
// QO'SHIMCHA, faqat parol/kod taxmin qilish xavfi bor endpointlarga qattiqroq chek qo'yadi.
// DISABLE_RATE_LIMIT faqat avtomatik test to'plami (playwright.config.js) uchun
// ishlatiladi — u bitta IP'dan (localhost) o'nlab "turli foydalanuvchi"ni
// simulyatsiya qilgani uchun haqiqiy trafikka o'xshamaydi. Oddiy `npm run dev`
// bilan ishga tushirilganda bu o'zgaruvchi yo'q, demak himoya doim faol.
const apiLimiter = process.env.DISABLE_RATE_LIMIT === 'true'
  ? (req, res, next) => next()
  : rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 600,
      standardHeaders: true,
      legacyHeaders: false,
      message: { message: "Juda ko'p so'rov yuborildi, birozdan keyin qayta urinib ko'ring" },
    });

const api = express.Router();
api.use(apiLimiter);
api.use('/auth', authRoutes);
api.use('/cards', cardsRoutes);
api.use('/wallet', walletRoutes);
api.use('/transactions', transactionsRoutes);
api.use('/contacts', contactsRoutes);
api.use('/utilities', utilitiesRoutes);
api.use('/payments', paymentsRoutes);
api.use('/business', businessRoutes);
api.use('/admin', adminRoutes);
api.use('/notifications', notificationsRoutes);

app.use('/api/v1', api);

// Payme/Click webhook'lari — RavonPay foydalanuvchi tokeni bilan emas, o'z
// autentifikatsiyasi bilan keladi, shuning uchun /api/v1 dan tashqarida.
app.use('/webhooks', webhooksRoutes);

app.get('/health', (_req, res) => res.json({ ok: true }));

// Har bir kutilmagan xatoga qisqa ID beriladi — foydalanuvchiga xato tafsilotlari
// (stack trace va h.k.) ko'rsatilmaydi, lekin shu ID orqali konsol loglaridan
// aniq shu hodisani topish mumkin (qo'llab-quvvatlash so'rovlarida foydali).
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  const errorId = randomUUID().slice(0, 8);
  console.error(`[${errorId}] ${req.method} ${req.originalUrl}`, err);
  res.status(500).json({ message: 'Serverda kutilmagan xatolik yuz berdi', errorId });
});

app.listen(PORT, () => {
  console.log(`RavonPay backend http://localhost:${PORT}/api/v1 manzilida ishga tushdi`);
});
