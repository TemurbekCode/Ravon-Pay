import { db, isFounder } from '../db.js';

// Biznes dashboard funksiyalarini faqat obuna faol bo'lganda (yoki hisob
// founder bo'lsa — u har doim bepul va cheklovsiz) ochadi. `requireAuth`dan
// KEYIN ishlatilishi shart (req.userId/req.dbUser kerak).
export function requireSubscription(req, res, next) {
  if (isFounder(req.dbUser.email)) return next();

  const row = db.prepare('SELECT subscription_active FROM businesses WHERE user_id = ?').get(req.userId);
  if (row?.subscription_active) return next();

  return res.status(402).json({ message: 'SUBSCRIPTION_REQUIRED' });
}
