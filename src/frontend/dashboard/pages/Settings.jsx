import { useOutletContext } from 'react-router-dom';
import { useTheme } from '../../../hooks/useTheme.js';
import { useLanguage } from '../../../hooks/useLanguage.js';

const LANGS = [
  { code: 'uz', flag: '🇺🇿', label: "O'zbekcha" },
  { code: 'en', flag: '🇬🇧', label: 'English' },
  { code: 'ru', flag: '🇷🇺', label: 'Русский' },
];

export default function Settings() {
  const { t } = useOutletContext();
  const { theme, setTheme } = useTheme();
  const { lang, setLang } = useLanguage();
  const check = <span className="check"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6 9 17l-5-5" /></svg></span>;

  return (
    <>
      <div className="page-head reveal"><h1>{t('set.title')}</h1></div>
      <div className="info-card reveal" style={{ maxWidth: 520 }}>
        <div className="setting-block">
          <div className="setting-label">{t('set.theme')}</div>
          <div className="theme-seg">
            <button className={`theme-opt dark-opt ${theme === 'dark' ? 'active' : ''}`} onClick={() => setTheme('dark')}>
              <span className="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" /></svg></span>
              <span>{t('set.dark')}</span>{check}
            </button>
            <button className={`theme-opt light-opt ${theme === 'light' ? 'active' : ''}`} onClick={() => setTheme('light')}>
              <span className="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg></span>
              <span>{t('set.light')}</span>{check}
            </button>
          </div>
        </div>
        <div className="setting-block">
          <div className="setting-label">{t('set.lang')}</div>
          <div className="lang-list">
            {LANGS.map((l) => (
              <button key={l.code} className={`lang-opt ${lang === l.code ? 'active' : ''}`} onClick={() => setLang(l.code)}>
                <span className="flag">{l.flag}</span><span>{l.label}</span>{check}
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
