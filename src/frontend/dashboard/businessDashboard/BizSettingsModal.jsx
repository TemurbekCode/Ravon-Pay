import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../../hooks/useTheme.js';
import { useLanguage } from '../../../hooks/useLanguage.js';
import { useAuth } from '../../../hooks/useAuth.js';
import { useBusiness } from '../../../hooks/useBusiness.js';
import { getInitials } from '../../../utils/formatCurrency.js';
import { ROUTES } from '../../../utils/constants.js';
import TermsModal from '../../shared/TermsModal.jsx';
import SupportModal from '../../shared/SupportModal.jsx';

const LANGS = [
  { code: 'uz', flag: '🇺🇿', label: "O'zbekcha" },
  { code: 'en', flag: '🇬🇧', label: 'English' },
  { code: 'ru', flag: '🇷🇺', label: 'Русский' },
];

export default function BizSettingsModal({ show, onClose, t }) {
  const { theme, setTheme } = useTheme();
  const { lang, setLang } = useLanguage();
  const { user, logout, updateProfile } = useAuth();
  const { verification, submitVerification } = useBusiness();
  const navigate = useNavigate();
  const check = <span className="check"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6 9 17l-5-5" /></svg></span>;

  const name = user?.fullName || 'Foydalanuvchi';
  const phone = user?.phone || '';

  const currentLang = LANGS.find((l) => l.code === lang) || LANGS[0];
  const [themeOpen, setThemeOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [emailOpen, setEmailOpen] = useState(false);
  const [emailValue, setEmailValue] = useState(user?.email || '');
  const [emailMsg, setEmailMsg] = useState('');
  const [twoFa, setTwoFa] = useState(true);
  const [push, setPush] = useState(true);
  const [emailNotif, setEmailNotif] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [verifyOpen, setVerifyOpen] = useState(false);
  const [taxIdValue, setTaxIdValue] = useState(verification?.taxId || '');
  const [addressValue, setAddressValue] = useState(verification?.legalAddress || '');
  const [verifyMsg, setVerifyMsg] = useState('');
  const [verifyBusy, setVerifyBusy] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);

  const goProfile = () => { navigate(ROUTES.profile); onClose(); };

  const submitEmail = async (e) => {
    e.preventDefault();
    setEmailMsg('');
    try {
      await updateProfile({ email: emailValue });
      setEmailMsg(t('email.updated'));
      setTimeout(() => { setEmailOpen(false); setEmailMsg(''); }, 1400);
    } catch (err) {
      setEmailMsg(err.message || 'Xatolik yuz berdi');
    }
  };

  const removeEmail = async () => {
    setEmailValue('');
    await updateProfile({ email: '' });
  };

  const submitVerify = async (e) => {
    e.preventDefault();
    setVerifyMsg('');
    setVerifyBusy(true);
    try {
      await submitVerification(taxIdValue.trim(), addressValue.trim());
      setVerifyOpen(false);
    } catch (err) {
      setVerifyMsg(err.message || 'Xatolik yuz berdi');
    } finally {
      setVerifyBusy(false);
    }
  };

  const handleDelete = () => { logout(); navigate(ROUTES.login); };

  return (
    <>
    <div className={`modal-overlay ${show ? 'show' : ''}`} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal">
        <div className="modal-head">
          <h3>{t('set.title')}</h3>
          <button className="modal-close" onClick={onClose}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12" /></svg></button>
        </div>

        <div className="pd-head clickable" style={{ marginBottom: 20 }} onClick={goProfile}>
          <span className="avatar" style={{ width: 46, height: 46, fontSize: 17 }}>{getInitials(name)}</span>
          <div><div className="pd-name">{name}</div><div className="pd-mail">{phone}</div></div>
        </div>

        <div className="setting-block">
          <div className="setting-label">{t('set.account')}</div>
          <button className="pd-item" onClick={() => setEmailOpen((v) => !v)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 6-10 7L2 6" /></svg>
            <span>{user?.email || t('email.none')}</span>
          </button>
          {emailOpen && (
            <form className="pw-form" onSubmit={submitEmail}>
              <div className="biz-field">
                <label>{t('profile.email')}</label>
                <input type="email" placeholder={t('email.placeholder')} value={emailValue} onChange={(e) => setEmailValue(e.target.value)} />
              </div>
              {emailMsg && <div className={`pw-msg ${emailMsg === t('email.updated') ? 'ok' : ''}`}>{emailMsg}</div>}
              <button type="submit" className="btn-new" style={{ width: '100%', justifyContent: 'center' }}>{t('email.save')}</button>
              {user?.email && (
                <button type="button" className="btn-ghost" style={{ width: '100%', justifyContent: 'center', marginTop: 8 }} onClick={removeEmail}>
                  {t('email.remove')}
                </button>
              )}
            </form>
          )}
          <div className="toggle-row">
            <span>{t('profile.2fa')}</span>
            <div className={`toggle-switch ${twoFa ? 'on' : ''}`} onClick={() => setTwoFa((v) => !v)} />
          </div>
        </div>

        <div className="setting-block">
          <div className="setting-label">{t('verify.title')}</div>
          <button className="pd-item pd-item-verify" onClick={() => setVerifyOpen((v) => !v)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" /><path d="M14 2v6h6M9 13h6M9 17h6" /></svg>
            <span className="pd-item-grow">{t('verify.taxId')}</span>
            <span className={`verify-status ${verification.status}`}>
              {verification.status === 'pending' ? t('verify.pending') : t('verify.none')}
            </span>
          </button>
          {verification.status === 'pending' && !verifyOpen && (
            <p style={{ fontSize: 12.5, color: 'var(--text-muted)', padding: '4px 12px 0' }}>{t('verify.pendingNote')}</p>
          )}
          {verifyOpen && (
            <form className="pw-form" onSubmit={submitVerify}>
              <div className="biz-field">
                <label>{t('verify.taxId')}</label>
                <input type="text" placeholder={t('verify.taxIdPh')} value={taxIdValue} onChange={(e) => setTaxIdValue(e.target.value)} required />
              </div>
              <div className="biz-field">
                <label>{t('verify.address')}</label>
                <input type="text" placeholder={t('verify.addressPh')} value={addressValue} onChange={(e) => setAddressValue(e.target.value)} required />
              </div>
              {verifyMsg && <div className="pw-msg">{verifyMsg}</div>}
              <button type="submit" className="btn-new" style={{ width: '100%', justifyContent: 'center' }} disabled={verifyBusy}>{t('verify.submit')}</button>
            </form>
          )}
        </div>

        <div className="setting-block">
          <div className="setting-label">{t('set.notifications')}</div>
          <div className="toggle-row">
            <span>{t('set.pushNotif')}</span>
            <div className={`toggle-switch ${push ? 'on' : ''}`} onClick={() => setPush((v) => !v)} />
          </div>
          <div className="toggle-row">
            <span>{t('set.emailNotif')}</span>
            <div className={`toggle-switch ${emailNotif ? 'on' : ''}`} onClick={() => setEmailNotif((v) => !v)} />
          </div>
        </div>

        <div className="setting-block">
          <div className="setting-label">{t('set.theme')}</div>
          <button className="select-row" onClick={() => setThemeOpen((v) => !v)}>
            <span className="sr-current">
              {theme === 'dark'
                ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" /></svg>
                : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>}
              {theme === 'dark' ? t('set.dark') : t('set.light')}
            </span>
            <svg className={`chev ${themeOpen ? 'open' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m6 9 6 6 6-6" /></svg>
          </button>
          {themeOpen && (
            <div className="theme-seg">
              <button className={`theme-opt dark-opt ${theme === 'dark' ? 'active' : ''}`} onClick={() => { setTheme('dark'); setThemeOpen(false); }}>
                <span className="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" /></svg></span>
                <span>{t('set.dark')}</span>{check}
              </button>
              <button className={`theme-opt light-opt ${theme === 'light' ? 'active' : ''}`} onClick={() => { setTheme('light'); setThemeOpen(false); }}>
                <span className="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg></span>
                <span>{t('set.light')}</span>{check}
              </button>
            </div>
          )}
        </div>

        <div className="setting-block">
          <div className="setting-label">{t('set.lang')}</div>
          <button className="select-row" onClick={() => setLangOpen((v) => !v)}>
            <span className="sr-current"><span className="flag-sm">{currentLang.flag}</span>{currentLang.label}</span>
            <svg className={`chev ${langOpen ? 'open' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m6 9 6 6 6-6" /></svg>
          </button>
          {langOpen && (
            <div className="lang-list">
              {LANGS.map((l) => (
                <button key={l.code} className={`lang-opt ${lang === l.code ? 'active' : ''}`} onClick={() => { setLang(l.code); setLangOpen(false); }}>
                  <span className="flag">{l.flag}</span><span>{l.label}</span>{check}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="setting-block">
          <div className="setting-label">{t('set.support')}</div>
          <button className="pd-item" onClick={() => setSupportOpen(true)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5H5l2.5-3A8.5 8.5 0 1 1 21 11.5Z" /></svg>
            <span>{t('set.contactSupport')}</span>
          </button>
          <button className="pd-item" onClick={() => setTermsOpen(true)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" /><path d="M14 2v6h6M9 13h6M9 17h6" /></svg>
            <span>{t('set.terms')}</span>
          </button>
        </div>

        <div className="setting-block">
          <div className="setting-label" style={{ color: 'var(--error)' }}>{t('set.danger')}</div>
          {!confirmDelete ? (
            <button className="pd-item danger" onClick={() => setConfirmDelete(true)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14Z" /></svg>
              <span>{t('set.deleteAccount')}</span>
            </button>
          ) : (
            <div className="delete-confirm">
              <p>{t('set.deleteConfirm')}</p>
              <div className="delete-actions">
                <button className="btn-ghost" onClick={() => setConfirmDelete(false)}>{t('set.cancel')}</button>
                <button className="btn-danger" onClick={handleDelete}>{t('set.deleteConfirmBtn')}</button>
              </div>
            </div>
          )}
        </div>

        <div className="set-version">{t('set.version')} 1.0.0</div>
      </div>
    </div>
    <TermsModal show={termsOpen} onClose={() => setTermsOpen(false)} />
    <SupportModal show={supportOpen} onClose={() => setSupportOpen(false)} t={t} />
    </>
  );
}
