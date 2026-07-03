import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.js';
import { useLanguage } from '../../hooks/useLanguage.js';
import { AUTH_I18N } from './auth.i18n.js';
import AuthShell from './AuthShell.jsx';
import SocialButtons from './SocialButtons.jsx';

export default function Login() {
  const { login } = useAuth();
  const { lang } = useLanguage();
  const navigate = useNavigate();
  const t = (key) => AUTH_I18N[lang]?.[key] ?? AUTH_I18N.uz[key] ?? key;

  const [form, setForm] = useState({ identifier: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await login(form);
      // Kirgan foydalanuvchi business bo'lsa business dashboardga
      const acc = res?.user?.accountType || res?.accountType;
      navigate(acc === 'business' ? '/business' : '/dashboard');
    } catch (err) {
      setError(err.message || 'Kirishda xatolik');
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

      <form onSubmit={handleSubmit}>
        <div className="field">
          <label>{t('f.emailphone')}</label>
          <div className="input-wrap">
            <svg className="lead" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="4" width="20" height="16" rx="2" /><path d="M22 6 12 13 2 6" />
            </svg>
            <input type="text" placeholder={t('ph.emailphone')} value={form.identifier}
              onChange={(e) => setForm({ ...form, identifier: e.target.value })} required />
          </div>
        </div>

        <div className="field">
          <label>{t('f.password')}</label>
          <div className="input-wrap">
            <svg className="lead" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <input type={showPass ? 'text' : 'password'} placeholder={t('ph.password')} value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })} required />
            <button type="button" className="toggle-pass" onClick={() => setShowPass((s) => !s)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" />
              </svg>
            </button>
          </div>
        </div>

        <div className="field-row">
          <label className="checkbox">
            <input type="checkbox" defaultChecked />
            <span className="box"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6 9 17l-5-5" /></svg></span>
            <span>{t('login.remember')}</span>
          </label>
          <Link to="#" className="link-muted">{t('login.forgot')}</Link>
        </div>

        <button type="submit" className="btn-submit" disabled={loading}>
          {loading ? '...' : t('login.btn')}
        </button>
      </form>

      <div className="divider"><span>{t('or')}</span></div>
      <SocialButtons />

      <div className="fp-foot">
        <span>{t('foot.help')}</span> <Link to="#">{t('foot.support')}</Link>
      </div>
    </AuthShell>
  );
}
