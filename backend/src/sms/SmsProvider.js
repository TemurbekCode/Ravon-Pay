// Qaysi SMS provayderi ishlatilishi SMS_PROVIDER environment o'zgaruvchisi
// bilan tanlanadi. Hech narsa sozlanmagan bo'lsa MockSmsProvider ishlaydi.
import { MockSmsProvider } from './MockSmsProvider.js';
import { EskizProvider } from './EskizProvider.js';

const providers = {
  mock: MockSmsProvider,
  eskiz: EskizProvider,
};

export function getSmsProvider() {
  const key = (process.env.SMS_PROVIDER || 'mock').toLowerCase();
  return providers[key] || MockSmsProvider;
}
