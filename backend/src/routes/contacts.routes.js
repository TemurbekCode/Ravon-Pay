import { Router } from 'express';
import { db, uid } from '../db.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { getWallet, nextSortOrder } from '../helpers.js';
import { ah } from '../asyncHandler.js';

const router = Router();
router.use(requireAuth);

const GRADS = ['linear-gradient(135deg,#F59E0B,#EF4444)', 'linear-gradient(135deg,#10B981,#22D3EE)', 'linear-gradient(135deg,#8B5CF6,#6366F1)', 'linear-gradient(135deg,#EC4899,#8B5CF6)'];

router.get('/', ah(async (req, res) => {
  res.json({ contacts: (await getWallet(req.userId)).contacts });
}));

router.post('/', ah(async (req, res) => {
  const { name, phone } = req.body || {};
  const count = (await getWallet(req.userId)).contacts.length;
  const contact = {
    id: uid('c'),
    initials: (name || '').split(' ').map((p) => p[0]).filter(Boolean).slice(0, 2).join('').toUpperCase(),
    name, phone,
    grad: GRADS[count % GRADS.length],
  };
  const order = await nextSortOrder('contacts', req.userId);
  await db.prepare('INSERT INTO contacts (id, user_id, initials, name, phone, grad, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .run(contact.id, req.userId, contact.initials, contact.name, contact.phone, contact.grad, order);
  res.json(contact);
}));

export default router;
