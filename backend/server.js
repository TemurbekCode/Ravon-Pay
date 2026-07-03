import './src/env.js'; // BIRINCHI import bo'lishi shart — boshqa modullar process.env'ni o'qishidan oldin .env yuklanadi

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import './src/db.js';

import authRoutes from './src/routes/auth.routes.js';
import cardsRoutes from './src/routes/cards.routes.js';
import walletRoutes from './src/routes/wallet.routes.js';
import transactionsRoutes from './src/routes/transactions.routes.js';
import contactsRoutes from './src/routes/contacts.routes.js';
import utilitiesRoutes from './src/routes/utilities.routes.js';
import paymentsRoutes from './src/routes/payments.routes.js';
import businessRoutes from './src/routes/business.routes.js';
import notificationsRoutes from './src/routes/notifications.routes.js';
import webhooksRoutes from './src/routes/webhooks.routes.js';

const app = express();
const PORT = process.env.PORT || 4000;
const corsOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173').split(',').map((s) => s.trim());

app.use(helmet());
app.use(cors({ origin: corsOrigins }));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true })); // Click webhook'i form-urlencoded yuborishi mumkin

const api = express.Router();
api.use('/auth', authRoutes);
api.use('/cards', cardsRoutes);
api.use('/wallet', walletRoutes);
api.use('/transactions', transactionsRoutes);
api.use('/contacts', contactsRoutes);
api.use('/utilities', utilitiesRoutes);
api.use('/payments', paymentsRoutes);
api.use('/business', businessRoutes);
api.use('/notifications', notificationsRoutes);

app.use('/api/v1', api);

// Payme/Click webhook'lari — RavonPay foydalanuvchi tokeni bilan emas, o'z
// autentifikatsiyasi bilan keladi, shuning uchun /api/v1 dan tashqarida.
app.use('/webhooks', webhooksRoutes);

app.get('/health', (_req, res) => res.json({ ok: true }));

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: 'Serverda kutilmagan xatolik yuz berdi' });
});

app.listen(PORT, () => {
  console.log(`RavonPay backend http://localhost:${PORT}/api/v1 manzilida ishga tushdi`);
});
