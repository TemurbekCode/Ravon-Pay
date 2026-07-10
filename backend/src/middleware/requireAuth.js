import { verifyToken } from '../authUtil.js';
import { db } from '../db.js';
import { ah } from '../asyncHandler.js';

// `Authorization: Bearer <token>` headerini tekshiradi va req.userId / req.user ni to'ldiradi.
export const requireAuth = ah(async (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ message: 'Avtorizatsiya talab qilinadi' });

  let userId;
  try {
    userId = verifyToken(token);
  } catch {
    return res.status(401).json({ message: 'Token yaroqsiz yoki muddati tugagan' });
  }

  const user = await db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  if (!user) return res.status(401).json({ message: 'Foydalanuvchi topilmadi' });
  // Har so'rovda bazadan qayta o'qilgani uchun, admin hisobni bloklasa, allaqachon
  // ochiq sessiya (eski token) ham DARHOL ishlamay qoladi — token muddati
  // tugashini kutish shart emas.
  if (user.blocked) return res.status(403).json({ message: "Hisobingiz bloklangan. Qo'llab-quvvatlash xizmatiga murojaat qiling." });

  req.userId = userId;
  req.dbUser = user;
  next();
});
