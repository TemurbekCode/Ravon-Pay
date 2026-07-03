// Backend hali ulanmagan/ishlamayotgan holatlarni aniqlash uchun umumiy yordamchi.
// Barcha service fayllari shu funksiyadan foydalanadi: real API'ga so'rov yuboriladi,
// tarmoq xatosi bo'lsa (backend yo'q) mock javobga qaytiladi, aks holda xato yuqoriga uzatiladi.
export function isNetworkError(err) {
  // Axios brauzerda backend ulanmasa `code: 'ERR_NETWORK'` va `message: 'Network Error'` qaytaradi —
  // shu ikkisi eng ishonchli belgi (message matnining katta-kichik harfi/probeliga bog'liq emas).
  if (err?.code === 'ERR_NETWORK' || err?.code === 'ECONNABORTED' || err?.code === 'ECONNREFUSED') return true;
  const m = (err?.message || '').toLowerCase();
  return m.includes('failed to fetch') || m.includes('network error') || m.includes('connection') || m.includes('load failed') || err?.name === 'TypeError';
}
