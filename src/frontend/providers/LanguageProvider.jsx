import { useEffect, useState } from 'react';
import { translations } from '../../utils/translations.js';
import { LanguageContext } from './LanguageContext.js';

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem('ravonpay_lang') || 'uz');

  useEffect(() => {
    document.documentElement.lang = lang;
    localStorage.setItem('ravonpay_lang', lang);
  }, [lang]);

  const t = (key) => translations[lang]?.[key] ?? translations.uz?.[key] ?? key;

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}
