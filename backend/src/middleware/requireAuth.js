import { verifyToken } from '../authUtil.js';
import { db } from '../db.js';

// `Authorization: Bearer <token>` headerini tekshiradi va req.userId / req.user ni to'ldiradi.
export function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ message: 'Avtorizatsiya talab qilinadi' });

  let userId;
  try {
    userId = verifyToken(token);
  } catch {
    return res.status(401).json({ message: 'Token yaroqsiz yoki muddati tugagan' });
  }

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  if (!user) return res.status(401).json({ message: 'Foydalanuvchi topilmadi' });

  req.userId = userId;
  req.dbUser = user;
  next();
}
