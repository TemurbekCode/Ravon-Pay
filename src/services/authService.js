import { apiClient } from './apiClient.js';
import { isNetworkError } from './networkUtil.js';

// OFFLINE MOCK REJIMI — backend ulanmagan holatda ishlaydigan zaxira.
// Har qanday email/telefon bilan ro'yxatdan o'tish/kirish mock rejimda ishlaydi,
// lekin HAQIQIY kiritilgan ism/kompaniya/hisob turi bilan va bo'sh (nol)
// hamyon/biznes ma'lumoti bilan boshlanadi.
const MOCK_USER_KEY = 'ravonpay_mock_user';

// `profiles` — foydalanuvchi qaysi hisob turlarini faollashtirganini bildiradi
// (masalan ['personal'] yoki ['personal','business']). `hasBoth` shundan kelib chiqadi.
function makeUser({ accountType = 'personal', email = 'user@ravonpay.uz', fullName = 'Foydalanuvchi', hasBoth = false, companyName = '', phone = '', profiles }) {
  const activeProfiles = profiles || (hasBoth ? ['personal', 'business'] : [accountType]);
  return { id: 'mock-' + Date.now(), fullName, email, phone, accountType, hasBoth: activeProfiles.length >= 2, profiles: activeProfiles, companyName, role: hasBoth ? 'founder' : 'user' };
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
  return makeUser({ accountType: 'personal', email: 'user@ravonpay.uz', fullName: 'Test Foydalanuvchi', hasBoth: false });
}

export const authService = {
  login: async (data) => {
    // Login formasi email'ni "identifier" (telefon yoki email) nomi bilan yuboradi.
    // Backend ishlab turgan bo'lsa — haqiqiy /auth/login chaqiriladi. Faqat backend
    // o'chirilgan bo'lsagina (tarmoq xatosi) shu yerdagi mock fallback ishga tushadi.
    const loginEmail = data?.email || data?.identifier;
    try {
      return await apiClient.post('/auth/login', data);
    } catch (err) {
      if (isNetworkError(err)) {
        return persistMockSession(makeUser({ accountType: 'personal', email: loginEmail || 'user@ravonpay.uz', fullName: 'Test Foydalanuvchi', hasBoth: false }));
      }
      throw err;
    }
  },

  register: async (data) => {
    const acc = data?.accountType || 'personal';
    try {
      return await apiClient.post('/auth/register', data);
    } catch (err) {
      if (isNetworkError(err)) {
        return persistMockSession(makeUser({
          accountType: acc,
          email: data?.email || 'user@ravonpay.uz',
          fullName: data?.fullName || 'Yangi Foydalanuvchi',
          hasBoth: false,
          companyName: data?.companyName || '',
          phone: data?.phone || '',
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

  logout: () => {
    const token = localStorage.getItem('ravonpay_access_token') || '';
    localStorage.removeItem(MOCK_USER_KEY);
    if (token.startsWith('mock-token')) return Promise.resolve({ ok: true });
    return apiClient.post('/auth/logout').catch(() => ({ ok: true }));
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

  // Profil ma'lumotlarini (ism, telefon) yangilaydi va serverda saqlaydi.
  updateProfile: async (data) => {
    try {
      return await apiClient.patch('/auth/me', data);
    } catch (err) {
      if (isNetworkError(err)) {
        const current = restoreMockUser();
        const updated = { ...current, fullName: data?.fullName ?? current.fullName, phone: data?.phone ?? current.phone };
        localStorage.setItem(MOCK_USER_KEY, JSON.stringify(updated));
        return { user: updated };
      }
      throw err;
    }
  },

  refresh: (refreshToken) => apiClient.post('/auth/refresh', { refreshToken }),

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

  changePassword: async (data) => {
    try {
      return await apiClient.post('/auth/change-password', data);
    } catch (err) {
      if (isNetworkError(err)) return { ok: true };
      throw err;
    }
  },
};
