import { createContext, useEffect, useState } from 'react';
import { authService } from '../../services/authService.js';
import { mockStore } from '../../services/mockStore.js';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Sahifa yangilanganda tokendan foydalanuvchini tiklash
  useEffect(() => {
    const token = localStorage.getItem('ravonpay_access_token');
    if (!token) { setLoading(false); return; }
    authService.me()
      .then((res) => setUser(res.user ?? res))
      .catch(() => localStorage.removeItem('ravonpay_access_token'))
      .finally(() => setLoading(false));
  }, []);

  // Telefon raqamiga SMS kod so'raydi (ro'yxatdan o'tish yoki kirish uchun).
  const requestOtp = (phone, mode) => authService.requestOtp({ phone, mode });

  // Kodni tekshiradi — to'g'ri bo'lsa, hisobga kiritadi (yoki mode='register'
  // bo'lsa, yangi hisob shu yerda yaratiladi).
  const verifyOtp = async ({ phone, code, mode, fullName, accountType, companyName }) => {
    const res = await authService.verifyOtp({ phone, code, mode, fullName, accountType, companyName });
    localStorage.setItem('ravonpay_access_token', res.accessToken);
    setUser(res.user);
    return res;
  };

  const loginWithGoogle = async (googleAccessToken) => {
    const res = await authService.googleAuth(googleAccessToken);
    localStorage.setItem('ravonpay_access_token', res.accessToken);
    setUser(res.user);
    return res;
  };

  const logout = () => {
    mockStore.clearAll(); // joriy profilning hamyon/biznes ma'lumotini tozalaydi (identifikatsiya o'chirilishidan oldin)
    localStorage.removeItem('ravonpay_access_token');
    localStorage.removeItem('ravonpay_mock_user');
    setUser(null);
  };

  const profiles = user?.profiles || (user?.accountType ? [user.accountType] : []);
  const hasBoth = profiles.length >= 2;

  // Foydalanuvchi allaqachon faollashtirgan profil turlari orasida almashtiradi
  // (masalan CEO yoki ikkala profilini ham ochgan oddiy foydalanuvchi).
  const switchAccount = async (accountType) => {
    if (!profiles.includes(accountType)) return;
    const res = await authService.switchActiveProfile(accountType);
    setUser(res.user);
  };

  // Hali mavjud bo'lmagan ikkinchi profil turini (personal <-> business) qo'shadi —
  // to'liq qayta ro'yxatdan o'tishning o'rniga.
  const activateProfile = async (accountType, extra = {}) => {
    const res = await authService.activateProfile({ accountType, ...extra });
    setUser(res.user);
    return res;
  };

  // Profil (ism, telefon, email) o'zgarishlarini serverda saqlaydi.
  const updateProfile = async (data) => {
    const res = await authService.updateProfile(data);
    setUser(res.user);
    return res;
  };

  const value = {
    user, loading,
    isAuthenticated: !!user,
    isBusiness: user?.accountType === 'business',
    hasBoth, profiles,
    requestOtp, verifyOtp, logout, setUser, switchAccount, activateProfile, updateProfile, loginWithGoogle,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
