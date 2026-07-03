import { useEffect, useRef, useState } from 'react';
import { useTheme } from '../../hooks/useTheme.js';
import { useLanguage } from '../../hooks/useLanguage.js';
import { AUTH_I18N } from './auth.i18n.js';
import './Auth.scss';

const LANGS = [
  { code: 'uz', flag: '🇺🇿', label: "O'zbekcha" },
  { code: 'en', flag: '🇬🇧', label: 'English' },
  { code: 'ru', flag: '🇷🇺', label: 'Русский' },
];

/**
 * Auth umumiy qobig'i — chap brand panel (50%) + o'ng forma panel (50%).
 * Login va Register shu komponent ichiga joylashadi.
 */
export default function AuthShell({ children }) {
  const { theme, toggleTheme } = useTheme();
  const { lang, setLang } = useLanguage();
  const [langOpen, setLangOpen] = useState(false);
  const langRef = useRef(null);

  const t = (key) => AUTH_I18N[lang]?.[key] ?? AUTH_I18N.uz[key] ?? key;

  useEffect(() => {
    const close = (e) => {
      if (langRef.current && !langRef.current.contains(e.target)) setLangOpen(false);
    };
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, []);

  return (
    <div className="auth">
      {/* ===== CHAP BRAND PANEL ===== */}
      <div className="brand-panel">
        <div className="bp-logo">
          <span className="mark">
            <img src="/RavonPayLogoBr.png" alt="RavonPay" />
          </span>
          Ravon Pay
        </div>

        <div className="bp-float f1">
          <span className="ic">
            <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2"><path d="M12 19V5m-7 7 7-7 7 7" /></svg>
          </span>
          <div>
            <div className="t">{t('bp.f1t')}</div>
            <div className="s">+1 200 000 so'm</div>
          </div>
        </div>
        <div className="bp-float f2">
          <span className="ic">
            <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2"><path d="M20 6 9 17l-5-5" /></svg>
          </span>
          <div>
            <div className="t">{t('bp.f2t')}</div>
            <div className="s">{t('bp.f2s')}</div>
          </div>
        </div>

        <div className="bp-mid">
          <h2>{t('bp.title')}</h2>
          <p>{t('bp.sub')}</p>
        </div>

        <div className="bp-stats">
          <div className="bp-stat"><div className="v">10K+</div><div className="l">{t('bp.s1')}</div></div>
          <div className="bp-stat"><div className="v">24/7</div><div className="l">{t('bp.s2')}</div></div>
          <div className="bp-stat"><div className="v">99.9%</div><div className="l">{t('bp.s3')}</div></div>
        </div>
      </div>

      {/* ===== O'NG FORMA PANEL ===== */}
      <div className="form-panel">
        <div className="fp-top">
          <div className="fp-logo">
            <span className="mark">
              <img src="/RavonPayLogoBr.png" alt="RavonPay" />
            </span>
            Ravon<span className="gradient-text">Pay</span>
          </div>

          <div className="fp-controls">
            <div className={`lang-mini ${langOpen ? 'open' : ''}`} ref={langRef}>
              <button className="lang-mini-btn" onClick={(e) => { e.stopPropagation(); setLangOpen((o) => !o); }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 15, height: 15 }}>
                  <circle cx="12" cy="12" r="9" />
                  <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
                </svg>
                <span>{lang.toUpperCase()}</span>
                <svg className="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m6 9 6 6 6-6" /></svg>
              </button>
              <div className="lang-mini-menu">
                {LANGS.map((l) => (
                  <button key={l.code} className={lang === l.code ? 'active' : ''}
                    onClick={() => { setLang(l.code); setLangOpen(false); }}>
                    <span className="flag">{l.flag}</span> {l.label}
                  </button>
                ))}
              </div>
            </div>

            <button className="icon-btn" onClick={toggleTheme} aria-label="Theme">
              {theme === 'dark' ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" /></svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="4" />
                  <path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
                </svg>
              )}
            </button>
          </div>
        </div>

        <div className="fp-body">{children}</div>
      </div>
    </div>
  );
}
