import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth.js';

// Foydalanuvchida hali biznes profil bo'lmasa — to'liq qayta ro'yxatdan o'tkazmasdan,
// faqat kompaniya nomini so'rab, mavjud identifikatsiyaga biznes profilni qo'shadi.
export default function AddBusinessProfileModal({ show, onClose, t }) {
  const { activateProfile } = useAuth();
  const navigate = useNavigate();
  const [companyName, setCompanyName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [prevShow, setPrevShow] = useState(show);

  if (show !== prevShow) {
    setPrevShow(show);
    if (show) { setCompanyName(''); setError(''); }
  }

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await activateProfile('business', { companyName: companyName.trim() });
      navigate('/business');
      onClose();
    } catch {
      setError(t('addbiz.error'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={`modal-overlay ${show ? 'show' : ''}`} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal">
        <div className="modal-head">
          <h3>{t('addbiz.title')}</h3>
          <button className="modal-close" onClick={onClose}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12" /></svg></button>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: 13.5, marginBottom: 18, marginTop: -8 }}>{t('addbiz.sub')}</p>
        <form onSubmit={submit}>
          <div className="field">
            <label>{t('addbiz.company')}</label>
            <input type="text" placeholder={t('addbiz.companyPh')} value={companyName} onChange={(e) => setCompanyName(e.target.value)} autoFocus />
          </div>
          {error && <div className="pw-msg">{error}</div>}
          <button type="submit" className="btn-primary-full" disabled={busy}>{t('addbiz.continue')}</button>
        </form>
      </div>
    </div>
  );
}
