import { db, isFounder } from '../db.js';
import { ah } from '../asyncHandler.js';

// Biznes dashboard funksiyalarini faqat obuna faol bo'lganda (yoki hisob
// founder bo'lsa — u har doim bepul va cheklovsiz) ochadi. `requireAuth`dan
// KEYIN ishlatilishi shart (req.userId/req.dbUser kerak).
export const requireSubscription = ah(async (req, res, next) => {
  if (isFounder(req.dbUser.email)) return next();

  const row = await db.prepare('SELECT subscription_active FROM businesses WHERE user_id = ?').get(req.userId);
  if (row?.subscription_active) return next();

  return res.status(402).json({ message: 'SUBSCRIPTION_REQUIRED' });
});
