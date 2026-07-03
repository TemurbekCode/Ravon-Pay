import { Router } from 'express';
import { db } from '../db.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { getNotifications } from '../helpers.js';

const router = Router();
router.use(requireAuth);

router.get('/', (req, res) => {
  res.json({ notifications: getNotifications(req.userId) });
});

router.post('/read-all', (req, res) => {
  db.prepare('UPDATE notifications SET read = 1 WHERE user_id = ?').run(req.userId);
  res.json({ notifications: getNotifications(req.userId) });
});

export default router;
