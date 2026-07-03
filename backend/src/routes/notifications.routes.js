import { Router } from 'express';
import { db } from '../db.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { getNotifications } from '../helpers.js';
import { ah } from '../asyncHandler.js';

const router = Router();
router.use(requireAuth);

router.get('/', ah(async (req, res) => {
  res.json({ notifications: await getNotifications(req.userId) });
}));

router.post('/read-all', ah(async (req, res) => {
  await db.prepare('UPDATE notifications SET read = 1 WHERE user_id = ?').run(req.userId);
  res.json({ notifications: await getNotifications(req.userId) });
}));

export default router;
