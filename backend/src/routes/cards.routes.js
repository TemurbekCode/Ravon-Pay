import { Router } from 'express';
import { db, uid } from '../db.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { getWallet, nextSortOrder } from '../helpers.js';
import { validateCard } from '../cardValidation.js';

const router = Router();
router.use(requireAuth);

router.get('/', (req, res) => {
  res.json({ cards: getWallet(req.userId).cards });
});

// Foydalanuvchi kiritgan haqiqiy karta ma'lumotlarini tekshiradi (Luhn, muddat,
// karta turi) va faqat MASKALANGAN raqamni saqlaydi. CVV backend'ga umuman
// yuborilmaydi va hech qachon saqlanmaydi.
router.post('/', (req, res) => {
  const result = validateCard(req.body || {});
  if (result.error) return res.status(400).json({ message: result.error });

  const cards = getWallet(req.userId).cards;
  const variant = cards.length % 2 === 0 ? 'v1' : 'v2';
  const card = {
    id: uid('card'),
    variant,
    type: result.type,
    num: result.masked,
    exp: result.expiry,
    holder: result.holder,
    balance: 0,
    frozen: false,
  };
  const order = nextSortOrder('cards', req.userId);
  db.prepare('INSERT INTO cards (id, user_id, variant, type, num, exp, holder, balance, frozen, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?)')
    .run(card.id, req.userId, card.variant, card.type, card.num, card.exp, card.holder, card.balance, order);
  res.json(card);
});

router.post('/:id/freeze', (req, res) => {
  const card = db.prepare('SELECT * FROM cards WHERE id = ? AND user_id = ?').get(req.params.id, req.userId);
  if (!card) return res.status(404).json({ message: 'Karta topilmadi' });
  db.prepare('UPDATE cards SET frozen = ? WHERE id = ?').run(card.frozen ? 0 : 1, card.id);
  res.json({ cards: getWallet(req.userId).cards });
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM cards WHERE id = ? AND user_id = ?').run(req.params.id, req.userId);
  res.json({ cards: getWallet(req.userId).cards });
});

export default router;
