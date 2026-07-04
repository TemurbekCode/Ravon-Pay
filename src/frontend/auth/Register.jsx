import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.js';
import { useLanguage } from '../../hooks/useLanguage.js';
import { AUTH_I18N } from './auth.i18n.js';
import { ACCOUNT_TYPES } from '../../utils/constants.js';
import { cardService } from '../../services/cardService.js';
import { isCardFormValid } from '../../utils/cardValidation.js';
import CardForm from '../shared/CardForm.jsx';
import AuthShell from './AuthShell.jsx';
import SocialButtons from './SocialButtons.jsx';
import AddEmailPrompt from './AddEmailPrompt.jsx';

const EMPTY_CARD = { cardNumber: '', expiry: '', cvv: '', cardholderName: '' };

export default function Register() {
  const { requestOtp, verifyOtp } = useAuth();
  const { lang } = useLanguage();
  const navigate = useNavigate();
  const t = (key) => AUTH_I18N[lang]?.[key] ?? AUTH_I18N.uz[key] ?? key;

  // 'type' (tur tanlash) -> 'form' (ism/telefon) -> 'otp' (SMS kod) -> 'email' (ixtiyoriy) -> 'card' (karta ulash, ixtiyoriy)
  const [step, setStep] = useState('type');
  const [accountType, setAccountType] = useState(ACCOUNT_TYPES.PERSONAL);
  const [form, setForm] = useState({ companyName: '', fullName: '', phone: '', terms: false });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [code, setCode] = useState('');
  const [devCode, setDevCode] = useState('');
  const [cardForm, setCardForm] = useState(EMPTY_CARD);
  const [cardBusy, setCardBusy] = useState(false);
  const [cardError, setCardError] = useState('');

  const isBusiness = accountType === ACCOUNT_TYPES.BUSINESS;

  const submitForm = async (e) => {
    e.preventDefault();
    if (!form.terms) { setError(t('form.terms')); return; }
    setLoading(true);
    setError('');
    try {
      const res = await requestOtp(form.phone, 'register');
      setDevCode(res.devCode || '');
      setStep('otp');
    } catch (err) {
      setError(err.message || 'Xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  const submitOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await verifyOtp({
        phone: form.phone, code, mode: 'register',
        fullName: form.fullName, accountType, companyName: form.companyName,
      });
      setStep('email');
    } catch (err) {
      setError(err.message || "Kod noto'g'ri");
    } finally {
      setLoading(false);
    }
  };

  const finishRegistration = () => {
    // Business hisob -> business dashboard, aks holda personal
    navigate(accountType === ACCOUNT_TYPES.BUSINESS ? '/business' : '/dashboard');
  };

  const submitCard = async (e) => {
    e.preventDefault();
    setCardBusy(true);
    setCardError('');
    try {
      await cardService.createCard(cardForm);
      finishRegistration();
    } catch {
      setCardError(t('cardform.invalid'));
    } finally {
      setCardBusy(false);
    }
  };

  return (
    <AuthShell>
      {step === 'card' ? (
        // ===== KARTA ULASH (ixtiyoriy) =====
        <>
          <div className="fp-head">
            <h1>{t('card.title')}</h1>
            <p>{t('card.sub')}</p>
          </div>
          <form onSubmit={submitCard}>
            <CardForm value={cardForm} onChange={setCardForm} t={t} />
            {cardError && <div className="auth-error">{cardError}</div>}
            <button type="submit" className="btn-submit" disabled={cardBusy || !isCardFormValid(cardForm)}>{cardBusy ? '...' : t('card.connect')}</button>
            <button type="button" className="btn-skip" onClick={finishRegistration} disabled={cardBusy}>{t('card.skip')}</button>
          </form>
        </>
      ) : step === 'email' ? (
        // ===== EMAIL QO'SHISH (ixtiyoriy) =====
        <AddEmailPrompt t={t} onDone={() => setStep('card')} />
      ) : step === 'otp' ? (
        // ===== SMS KOD TASDIQLASH =====
        <>
          <button type="button" className="back-btn" onClick={() => setStep('form')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5m7 7-7-7 7-7" /></svg>
            <span>{t('back')}</span>
          </button>
          <div className="fp-head">
            <h1>{t('otp.title')}</h1>
            <p>{t('otp.sub')}</p>
          </div>
          {error && <div className="auth-error">{error}</div>}
          {devCode && <div className="auth-error" style={{ color: 'var(--brand)', background: 'rgba(99,102,241,0.1)' }}>{t('otp.demo')} {devCode}</div>}
          <form onSubmit={submitOtp}>
            <div className="field">
              <label>{t('otp.title')}</label>
              <div className="input-wrap">
                <svg className="lead" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                <input type="text" inputMode="numeric" maxLength={4} placeholder={t('otp.codePh')} value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 4))} required />
              </div>
            </div>
            <button type="submit" className="btn-submit" disabled={loading || code.length < 4}>{loading ? '...' : t('otp.verify')}</button>
            <button type="button" className="btn-skip" onClick={submitForm} disabled={loading}>{t('otp.resend')}</button>
          </form>
        </>
      ) : step === 'type' ? (
        // ===== BOSQICH 1: HISOB TURI =====
        <>
          <div className="fp-head">
            <h1>{t('type.title')}</h1>
            <p>{t('type.sub')}</p>
          </div>
          <div className="tabs">
            <Link to="/login" className="tab tab-link">{t('tab.login')}</Link>
            <button className="tab active" type="button">{t('tab.signup')}</button>
          </div>
          <div className="type-cards">
            <button type="button" className={`type-card personal ${!isBusiness ? 'active' : ''}`}
              onClick={() => setAccountType(ACCOUNT_TYPES.PERSONAL)}>
              <span className="tc-ic">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></svg>
              </span>
              <div className="tc-info">
                <div className="tc-title">{t('type.personal')}</div>
                <div className="tc-desc">{t('type.personalDesc')}</div>
              </div>
              <span className="tc-check"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6 9 17l-5-5" /></svg></span>
            </button>
            <button type="button" className={`type-card business ${isBusiness ? 'active' : ''}`}
              onClick={() => setAccountType(ACCOUNT_TYPES.BUSINESS)}>
              <span className="tc-ic">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 21h18M5 21V7l8-4v18M19 21V11l-6-4" /><path d="M9 9v.01M9 12v.01M9 15v.01M9 18v.01" /></svg>
              </span>
              <div className="tc-info">
                <div className="tc-title">{t('type.business')}</div>
                <div className="tc-desc">{t('type.businessDesc')}</div>
              </div>
              <span className="tc-check"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6 9 17l-5-5" /></svg></span>
            </button>
          </div>
          <button type="button" className="btn-submit" onClick={() => setStep('form')}>
            {t('type.next')}
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M5 12h14m-7-7 7 7-7 7" /></svg>
          </button>
        </>
      ) : (
        // ===== BOSQICH 2: FORMA (ism + telefon, email/parolsiz) =====
        <>
          <button type="button" className="back-btn" onClick={() => setStep('type')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5m7 7-7-7 7-7" /></svg>
            <span>{t('back')}</span>
          </button>
          <div className="fp-head">
            <h1>{t('form.title')}</h1>
            <p>
              <span className={`type-chip ${accountType}`}>
                <span className="d" />
                <span>{isBusiness ? t('chip.business') : t('chip.personal')}</span>
              </span>
            </p>
          </div>

          {error && <div className="auth-error">{error}</div>}

          <form onSubmit={submitForm}>
            {isBusiness && (
              <div className="field">
                <label>{t('f.company')}</label>
                <div className="input-wrap">
                  <svg className="lead" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 21h18M5 21V7l8-4v18M19 21V11l-6-4" /></svg>
                  <input type="text" placeholder={t('ph.company')} value={form.companyName}
                    onChange={(e) => setForm({ ...form, companyName: e.target.value })} />
                </div>
              </div>
            )}

            <div className="field">
              <label>{t('f.fullname')}</label>
              <div className="input-wrap">
                <svg className="lead" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></svg>
                <input type="text" placeholder={t('ph.fullname')} value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })} required />
              </div>
            </div>

            <div className="field">
              <label>{t('f.phone')}</label>
              <div className="input-wrap phone">
                <svg className="lead" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3-8.6A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.3 1.8.6 2.6a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.5-1.1a2 2 0 0 1 2.1-.5c.8.3 1.7.5 2.6.6a2 2 0 0 1 1.7 2Z" /></svg>
                <span className="prefix">+998</span>
                <input type="tel" placeholder="90 123 45 67" value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
              </div>
            </div>

            <label className="checkbox" style={{ marginBottom: 22 }}>
              <input type="checkbox" checked={form.terms} onChange={(e) => setForm({ ...form, terms: e.target.checked })} />
              <span className="box"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6 9 17l-5-5" /></svg></span>
              <span>{t('form.terms')}</span>
            </label>

            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? '...' : t('otp.sendBtn')}
            </button>
          </form>

          <div className="divider"><span>{t('or')}</span></div>
          <SocialButtons />
        </>
      )}

      <div className="fp-foot">
        <span>{t('foot.help')}</span> <Link to="#">{t('foot.support')}</Link>
      </div>
    </AuthShell>
  );
}
