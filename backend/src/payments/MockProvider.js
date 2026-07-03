// Standart provayder — haqiqiy Payme/Click/Payoneer kalitlari hali sozlanmagan
// bo'lsa ishlaydi. Pul harakati darhol (instant) deb hisoblanadi — bu joriy
// demo/dev xatti-harakatining o'zi, hech narsa o'zgarmaydi.
export const MockProvider = {
  name: 'mock',

  async createTopUpCheckout() {
    return { mode: 'instant' };
  },

  async createPayout({ amount, card }) {
    return { status: 'done', reference: `mock-${card?.num || 'card'}-${amount}` };
  },
};
