import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth.js';
import { getInitials } from '../../../utils/formatCurrency.js';

export default function Profile() {
  const { t } = useOutletContext();
  const { user, updateProfile } = useAuth();
  const [twoFa, setTwoFa] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ fullName: '', phone: '' });
  const [busy, setBusy] = useState(false);

  const name = user?.fullName || 'Aziz Karimov';
  const email = user?.email || 'aziz@email.com';
  const phone = user?.phone || '+998 90 123 45 67';

  const startEdit = () => { setForm({ fullName: name, phone }); setEditing(true); };

  const saveEdit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await updateProfile({ fullName: form.fullName, phone: form.phone });
      setEditing(false);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="page-head reveal"><h1>{t('page.profile')}</h1></div>

      <div className="profile-hero reveal">
        <div className="avatar">{getInitials(name)}</div>
        <div className="ph-info">
          <div className="ph-name">{name}
            <span className="ph-verified"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6 9 17l-5-5" /></svg>{t('profile.verified')}</span>
          </div>
          <div className="ph-mail">{email}</div>
        </div>
        <button className="ph-edit" onClick={startEdit}>{t('profile.edit')}</button>
      </div>

      {editing && (
        <form className="info-card reveal" onSubmit={saveEdit}>
          <div className="info-card-title">{t('profile.personal')}</div>
          <div className="field">
            <label>{t('profile.name')}</label>
            <input type="text" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} required />
          </div>
          <div className="field">
            <label>{t('profile.phone')}</label>
            <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
          </div>
          <div className="delete-actions">
            <button type="button" className="btn-ghost" onClick={() => setEditing(false)}>{t('set.cancel')}</button>
            <button type="submit" className="btn-danger" style={{ background: 'var(--gradient-brand)' }} disabled={busy}>{t('profile.edit')}</button>
          </div>
        </form>
      )}

      <div className="info-card reveal">
        <div className="info-card-title">{t('profile.personal')}</div>
        <div className="info-row"><span className="info-label">{t('profile.name')}</span><span className="info-value">{name}</span></div>
        <div className="info-row"><span className="info-label">{t('profile.phone')}</span><span className="info-value">{phone}</span></div>
        <div className="info-row"><span className="info-label">{t('profile.email')}</span><span className="info-value">{email}</span></div>
      </div>

      <div className="info-card reveal">
        <div className="info-card-title">{t('profile.security')}</div>
        <div className="info-row"><span className="info-label">{t('profile.changepass')}</span><span className="info-action">{t('profile.edit')}</span></div>
        <div className="info-row">
          <span className="info-label">{t('profile.2fa')}</span>
          <div className={`toggle-switch ${twoFa ? 'on' : ''}`} onClick={() => setTwoFa((v) => !v)} />
        </div>
      </div>
    </>
  );
}
