import { Router } from 'express';
import { db, uid } from '../db.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { requireSubscription } from '../middleware/requireSubscription.js';
import { getBusiness, nextSortOrder } from '../helpers.js';
import { ah } from '../asyncHandler.js';

const router = Router();
router.use(requireAuth);
router.use(requireSubscription);

router.get('/links', ah(async (req, res) => {
  res.json({ links: (await getBusiness(req.userId)).links });
}));

router.post('/links', ah(async (req, res) => {
  const { title } = req.body || {};
  const amount = Number(req.body?.amount) || 0;
  const link = {
    id: uid('lnk'),
    title,
    slug: (title || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 24) || uid('l'),
    uses: 0,
    amount,
  };
  const order = await nextSortOrder('biz_links', req.userId);
  await db.prepare('INSERT INTO biz_links (id, user_id, title, slug, uses, amount, sort_order) VALUES (?, ?, ?, ?, 0, ?, ?)')
    .run(link.id, req.userId, link.title, link.slug, link.amount, order);
  res.json(link);
}));

router.get('/analytics', ah(async (req, res) => {
  const b = await getBusiness(req.userId);
  res.json({ revenue: b.revenue, salesCount: b.salesCount, avgOrder: b.avgOrder });
}));

export default router;
