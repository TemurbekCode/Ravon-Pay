import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.js';
import { useLanguage } from '../../hooks/useLanguage.js';
import { warmupBackend } from '../../services/apiClient.js';
import { AUTH_I18N } from './auth.i18n.js';
import AuthShell from './AuthShell.jsx';
import SocialButtons from './SocialButtons.jsx';

export default function Login() {
  const { requestOtp, verifyOtp } = useAuth();
  const { lang } = useLanguage();
  const navigate = useNavigate();
  const t = (key) => AUTH_I18N[lang]?.[key] ?? AUTH_I18N.uz[key] ?? key;

  useEffect(() => { warmupBackend(); }, []);

  const [step, setStep] = useState('phone'); // 'phone' -> 'otp'
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [devCode, setDevCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submitPhone = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await requestOtp(phone, 'login');
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
      const res = await verifyOtp({ phone, code, mode: 'login' });
      const acc = res?.user?.accountType;
      navigate(acc === 'business' ? '/business' : '/dashboard');
    } catch (err) {
      setError(err.message || "Kod noto'g'ri");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell>
      <div className="fp-head">
        <h1>{t('login.title')}</h1>
        <p>{t('login.sub')}</p>
      </div>

      <div className="tabs">
        <button className="tab active" type="button">{t('tab.login')}</button>
        <Link to="/register" className="tab tab-link">{t('tab.signup')}</Link>
      </div>

      {error && <div className="auth-error">{error}</div>}
      {step === 'otp' && devCode && <div className="auth-error" style={{ color: 'var(--brand)', background: 'rgba(99,102,241,0.1)' }}>{t('otp.demo')} {devCode}</div>}

      {step === 'phone' ? (
        <form onSubmit={submitPhone}>
          <div className="field">
            <label>{t('f.phone')}</label>
            <div className="input-wrap phone">
              <svg className="lead" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3-8.6A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.3 1.8.6 2.6a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.5-1.1a2 2 0 0 1 2.1-.5c.8.3 1.7.5 2.6.6a2 2 0 0 1 1.7 2Z" /></svg>
              <span className="prefix">+998</span>
              <input type="tel" placeholder="90 123 45 67" value={phone} onChange={(e) => setPhone(e.target.value)} required />
            </div>
          </div>

          <button type="submit" className="btn-submit" disabled={loading}>
            {loading ? '...' : t('otp.sendBtn')}
          </button>
        </form>
      ) : (
        <form onSubmit={submitOtp}>
          <div className="field">
            <label>{t('otp.title')}</label>
            <div className="input-wrap">
              <svg className="lead" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
              <input type="text" inputMode="numeric" maxLength={4} placeholder={t('otp.codePh')} value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 4))} required />
            </div>
          </div>
          <button type="submit" className="btn-submit" disabled={loading || code.length < 4}>
            {loading ? '...' : t('otp.verify')}
          </button>
          <button type="button" className="btn-skip" onClick={submitPhone} disabled={loading}>{t('otp.resend')}</button>
        </form>
      )}

      <div className="divider"><span>{t('or')}</span></div>
      <SocialButtons />

      <div className="fp-foot">
        <span>{t('foot.help')}</span> <Link to="#">{t('foot.support')}</Link>
      </div>
    </AuthShell>
  );
}
