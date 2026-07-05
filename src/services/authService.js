import { apiClient } from './apiClient.js';
import { isNetworkError } from './networkUtil.js';

// OFFLINE MOCK REJIMI — backend ulanmagan holatda ishlaydigan zaxira.
// Har qanday telefon raqami bilan ro'yxatdan o'tish/kirish mock rejimda ishlaydi
// (kod har doim "1234"), lekin HAQIQIY kiritilgan ism/kompaniya/hisob turi bilan
// va bo'sh (nol) hamyon/biznes ma'lumoti bilan boshlanadi.
const MOCK_USER_KEY = 'ravonpay_mock_user';
const MOCK_OTP_CODE = '1234';

// `profiles` — foydalanuvchi qaysi hisob turlarini faollashtirganini bildiradi
// (masalan ['personal'] yoki ['personal','business']). `hasBoth` shundan kelib chiqadi.
function makeUser({ accountType = 'personal', email = '', fullName = 'Foydalanuvchi', hasBoth = false, companyName = '', phone = '', profiles }) {
  const activeProfiles = profiles || (hasBoth ? ['personal', 'business'] : [accountType]);
  return { id: 'mock-' + Date.now(), fullName, email, phone, accountType, hasBoth: activeProfiles.length >= 2, profiles: activeProfiles, companyName, role: hasBoth ? 'founder' : 'user', twoFaEnabled: false };
}

// Mock sessiyani localStorage'ga yozadi — token prefiksi orqali keyinchalik
// (sahifa yangilanganda) haqiqiy identifikatsiyani tiklash mumkin bo'ladi.
function persistMockSession(user) {
  localStorage.setItem(MOCK_USER_KEY, JSON.stringify(user));
  return { accessToken: 'mock-token-' + Date.now(), user };
}

function restoreMockUser() {
  const raw = localStorage.getItem(MOCK_USER_KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      // Eski (profiles maydonisiz) saqlangan sessiyalarni migratsiya qilish.
      if (!parsed.profiles) parsed.profiles = [parsed.accountType];
      parsed.hasBoth = parsed.profiles.length >= 2;
      return parsed;
    } catch { /* fall through */ }
  }
  return makeUser({ accountType: 'personal', fullName: 'Test Foydalanuvchi', hasBoth: false });
}

export const authService = {
  // Ro'yxatdan o'tish/kirish uchun SMS kod so'raydi. `mode: 'register'|'login'`.
  // Backend o'chirilgan bo'lsa (mock) — kod har doim "1234" bo'ladi.
  requestOtp: async ({ phone, mode }) => {
    try {
      return await apiClient.post('/auth/otp/request', { phone, mode });
    } catch (err) {
      if (isNetworkError(err)) return { sent: true, devCode: MOCK_OTP_CODE };
      throw err;
    }
  },

  // Kodni tekshiradi va ro'yxatdan o'tkazadi (mode: 'register', fullName/accountType/
  // companyName bilan) yoki mavjud hisobga kiritadi (mode: 'login').
  verifyOtp: async ({ phone, code, mode, fullName, accountType, companyName }) => {
    try {
      return await apiClient.post('/auth/otp/verify', { phone, code, mode, fullName, accountType, companyName });
    } catch (err) {
      if (isNetworkError(err)) {
        if (mode === 'register' && code !== MOCK_OTP_CODE) throw new Error("Kod noto'g'ri", { cause: err });
        const acc = accountType || 'personal';
        return persistMockSession(makeUser({
          accountType: acc,
          fullName: fullName || 'Yangi Foydalanuvchi',
          hasBoth: false,
          companyName: companyName || '',
          phone: phone || '',
        }));
      }
      throw err;
    }
  },

  me: async () => {
    const token = localStorage.getItem('ravonpay_access_token') || '';
    if (token.startsWith('mock-token')) {
      return { user: restoreMockUser() };
    }
    try {
      return await apiClient.get('/auth/me');
    } catch (err) {
      if (isNetworkError(err)) return { user: restoreMockUser() };
      throw err;
    }
  },

  logout: (refreshToken) => {
    const token = localStorage.getItem('ravonpay_access_token') || '';
    localStorage.removeItem(MOCK_USER_KEY);
    if (token.startsWith('mock-token')) return Promise.resolve({ ok: true });
    return apiClient.post('/auth/logout', { refreshToken }).catch(() => ({ ok: true }));
  },

  // Allaqachon faollashtirilgan profil turiga o'tish (qayta ro'yxatdan o'tmasdan).
  switchActiveProfile: async (accountType) => {
    try {
      return await apiClient.post('/auth/switch-profile', { accountType });
    } catch (err) {
      if (isNetworkError(err)) {
        const current = restoreMockUser();
        const updated = { ...current, accountType };
        localStorage.setItem(MOCK_USER_KEY, JSON.stringify(updated));
        return { user: updated };
      }
      throw err;
    }
  },

  // Ikkinchi (hali mavjud bo'lmagan) profil turini faollashtiradi — to'liq qayta
  // ro'yxatdan o'tishning o'rniga, allaqachon ma'lum bo'lgan identifikatsiyaga qo'shiladi.
  activateProfile: async (data) => {
    try {
      return await apiClient.post('/auth/activate-profile', data);
    } catch (err) {
      if (isNetworkError(err)) {
        const current = restoreMockUser();
        const profiles = Array.from(new Set([...(current.profiles || [current.accountType]), data.accountType]));
        const updated = {
          ...current,
          profiles,
          hasBoth: profiles.length >= 2,
          accountType: data.accountType,
          companyName: data.accountType === 'business' ? (data.companyName || current.companyName) : current.companyName,
        };
        localStorage.setItem(MOCK_USER_KEY, JSON.stringify(updated));
        return { user: updated };
      }
      throw err;
    }
  },

  // Profil ma'lumotlarini (ism, telefon, email) yangilaydi va serverda saqlaydi.
  // `email: ''` yuborilsa — email o'chiriladi (olib tashlanadi).
  updateProfile: async (data) => {
    try {
      return await apiClient.patch('/auth/me', data);
    } catch (err) {
      if (isNetworkError(err)) {
        const current = restoreMockUser();
        const updated = {
          ...current,
          fullName: data?.fullName ?? current.fullName,
          phone: data?.phone ?? current.phone,
          email: 'email' in (data || {}) ? data.email : current.email,
          twoFaEnabled: 'twoFaEnabled' in (data || {}) ? !!data.twoFaEnabled : current.twoFaEnabled,
        };
        localStorage.setItem(MOCK_USER_KEY, JSON.stringify(updated));
        return { user: updated };
      }
      throw err;
    }
  },

  refresh: (refreshToken) => apiClient.post('/auth/refresh', { refreshToken }),

  // Ikki bosqichli himoya yoqilgan bo'lsa, pul yechishdan oldin shu orqali
  // o'z telefon raqamiga yangi tasdiqlash kodi so'raladi.
  request2FAChallenge: async () => {
    try {
      return await apiClient.post('/auth/2fa/challenge');
    } catch (err) {
      if (isNetworkError(err)) return { sent: true, devCode: MOCK_OTP_CODE };
      throw err;
    }
  },

  // Google orqali kirish — backend Google'ning userinfo endpoint'i orqali accessToken'ni
  // tekshiradi. Buni mock qilib bo'lmaydi (haqiqiy Google tasdiqlash kerak), shuning uchun
  // backend ishlamasa tushunarli xabar bilan xato qaytariladi.
  googleAuth: async (accessToken) => {
    try {
      return await apiClient.post('/auth/google', { accessToken });
    } catch (err) {
      if (isNetworkError(err)) throw new Error('Backend serverga ulanib bo\'lmadi. Google orqali kirish uchun backend ishga tushirilgan bo\'lishi kerak.', { cause: err });
      throw err;
    }
  },

  telegramAuth: (data) => apiClient.post('/auth/telegram', data),
};
