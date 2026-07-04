import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth.js';

// Ro'yxatdan o'tgandan keyin bir marta ko'rsatiladigan, o'tkazib yuborsa
// bo'ladigan taklif — email ixtiyoriy, keyinroq Sozlamalar orqali ham
// qo'shish/o'zgartirish mumkin.
export default function AddEmailPrompt({ t, onDone }) {
  const { updateProfile } = useAuth();
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await updateProfile({ email });
      onDone();
    } catch (err) {
      setError(err.message || 'Xatolik yuz berdi');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="fp-head">
        <h1>{t('addemail.title')}</h1>
        <p>{t('addemail.sub')}</p>
      </div>
      {error && <div className="auth-error">{error}</div>}
      <form onSubmit={save}>
        <div className="field">
          <label>{t('f.email')}</label>
          <div className="input-wrap">
            <svg className="lead" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 6-10 7L2 6" /></svg>
            <input type="email" placeholder={t('ph.email')} value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
        </div>
        <button type="submit" className="btn-submit" disabled={busy || !email}>{busy ? '...' : t('addemail.save')}</button>
        <button type="button" className="btn-skip" onClick={onDone} disabled={busy}>{t('addemail.skip')}</button>
      </form>
    </>
  );
}
