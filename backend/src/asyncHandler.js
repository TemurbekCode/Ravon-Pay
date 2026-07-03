// Express 4 asinxron route/middleware funksiyalaridan chiqqan xatoliklarni
// avtomatik tutmaydi (Express 5'dan farqli) — shuning uchun har bir async
// handler shu bilan o'ralishi kerak, aks holda DB xatosi so'rovni "osilib
// qolgan" holatga keltirishi yoki serverni kutilmagan tarzda yiqitishi mumkin.
export function ah(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}
