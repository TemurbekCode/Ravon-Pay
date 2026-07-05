import { apiClient } from './apiClient.js';

// ESLATMA: bu fayl ilgari (backend hali qurilmagan paytda) har bir metod uchun
// "tarmoq xatosi bo'lsa, soxta mahalliy hisob yasa" degan zaxira mantiqqa ega edi.
// Bu XAVFLI bo'lib chiqdi: agar backend sekin javob bersa (masalan bepul hosting
// "uxlab" qolgani uchun uyg'onayotganda) yoki vaqtincha tarmoq uzilsa, foydalanuvchi
// KIRISH/RO'YXATDAN O'TISH payti buni "tarmoq xatosi" deb sezib, ORQADAN unga
// har safar YANGI, bo'sh, faqat shu brauzerga tegishli soxta hisob yaratib berardi —
// natijada haqiqiy hisobiga hech qachon qayta kira olmasdi ("account saqlanmayapti"
// degan shikoyat aynan shundan edi). Endi haqiqiy backend to'liq ishlagani uchun bu
// zaxira butunlay olib tashlandi — muvaffaqiyatsizlik endi soxta muvaffaqiyat
// ko'rinishida yashirilmaydi, aniq xato sifatida foydalanuvchiga ko'rsatiladi.
export const authService = {
  requestOtp: ({ phone, mode }) => apiClient.post('/auth/otp/request', { phone, mode }),

  verifyOtp: ({ phone, code, mode, fullName, accountType, companyName }) =>
    apiClient.post('/auth/otp/verify', { phone, code, mode, fullName, accountType, companyName }),

  me: () => apiClient.get('/auth/me'),

  logout: (refreshToken) => apiClient.post('/auth/logout', { refreshToken }).catch(() => ({ ok: true })),

  switchActiveProfile: (accountType) => apiClient.post('/auth/switch-profile', { accountType }),

  activateProfile: (data) => apiClient.post('/auth/activate-profile', data),

  updateProfile: (data) => apiClient.patch('/auth/me', data),

  refresh: (refreshToken) => apiClient.post('/auth/refresh', { refreshToken }),

  request2FAChallenge: () => apiClient.post('/auth/2fa/challenge'),

  googleAuth: (accessToken) => apiClient.post('/auth/google', { accessToken }),

  telegramAuth: (data) => apiClient.post('/auth/telegram', data),
};
