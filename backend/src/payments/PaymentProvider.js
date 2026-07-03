// Haqiqiy to'lov provayderlariga (Payme, Click, Payoneer) ulanish uchun umumiy
// shartnoma (interfeys). Har bir provayder quyidagi metodlarni amalga oshiradi:
//
//   name: string
//
//   createTopUpCheckout({ userId, amount, orderId }) -> Promise<{
//     mode: 'instant' | 'redirect',
//     // mode === 'instant' bo'lsa (hozircha MockProvider): pul darhol hamyonga tushadi
//     // mode === 'redirect' bo'lsa (Payme/Click): foydalanuvchi shu checkoutUrl'ga
//     // yo'naltiriladi, pul webhook orqali keyinroq tasdiqlanadi
//     checkoutUrl?: string,
//   }>
//
//   createPayout({ userId, amount, card }) -> Promise<{ status: 'pending' | 'done', reference: string }>
//     Hamyondan real kartaga pul yechib berish (Payme/Click "chiqim" API'si).
//
// Qaysi provayder ishlatilishi PAYMENT_PROVIDER environment o'zgaruvchisi bilan
// tanlanadi (.env.example'ga qarang). Hech narsa sozlanmagan bo'lsa — MockProvider
// ishlaydi va joriy simulyatsiya xatti-harakati o'zgarishsiz qoladi.
import { MockProvider } from './MockProvider.js';
import { PaymeProvider } from './PaymeProvider.js';
import { ClickProvider } from './ClickProvider.js';

const providers = {
  mock: MockProvider,
  payme: PaymeProvider,
  click: ClickProvider,
};

export function getPaymentProvider() {
  const key = (process.env.PAYMENT_PROVIDER || 'mock').toLowerCase();
  return providers[key] || MockProvider;
}
