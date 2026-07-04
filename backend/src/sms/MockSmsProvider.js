// Standart provayder — haqiqiy Eskiz.uz kalitlari hali sozlanmagan bo'lsa
// ishlaydi. Haqiqiy SMS yubormaydi — o'rniga kodni to'g'ridan-to'g'ri
// javobda qaytaradi, shunda frontend uni demo rejimida ko'rsatadi.
export const MockSmsProvider = {
  name: 'mock',
  async send(phone, code) {
    console.log(`[SMS demo] ${phone} raqamiga kod: ${code}`);
    return { devCode: code };
  },
};
