// Admin panelga faqat role='admin' bo'lgan hisob kira oladi (hozircha faqat
// ravonpay@gmail.com — db.js'dagi migratsiya shu emailni doim admin qiladi).
// `requireAuth`dan KEYIN ishlatilishi shart (req.dbUser kerak).
export function requireAdmin(req, res, next) {
  if (req.dbUser?.role !== 'admin') return res.status(403).json({ message: 'Ruxsat yo\'q' });
  next();
}
