// Payme/Click'ning o'z serverlaridan kelgan chaqiruvlarni qabul qiladi — bu
// RavonPay foydalanuvchisi emas, shuning uchun requireAuth ISHLATILMAYDI.
// O'rniga har bir provayder o'zining imzo/autentifikatsiya usulini tekshiradi
// (Payme: Basic Auth, Click: MD5 imzo).
import { Router } from 'express';
import { verifyPaymeAuth, handlePaymeWebhook } from '../payments/PaymeProvider.js';
import { handleClickWebhook } from '../payments/ClickProvider.js';
import { creditWallet } from '../helpers.js';

const router = Router();

router.post('/payme', (req, res) => {
  if (!verifyPaymeAuth(req)) {
    return res.json({ jsonrpc: '2.0', id: req.body?.id ?? null, error: { code: -32504, message: "Ruxsat yo'q" } });
  }
  const result = handlePaymeWebhook(req.body, {
    onPerform: ({ userId, amount, reference }) => creditWallet(userId, amount, `Payme orqali to'ldirildi (${reference})`),
  });
  res.json(result);
});

router.post('/click', (req, res) => {
  const result = handleClickWebhook(req.body, {
    onPerform: ({ userId, amount, reference }) => creditWallet(userId, amount, `Click orqali to'ldirildi (${reference})`),
  });
  res.json(result);
});

export default router;
