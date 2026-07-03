import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useWallet } from '../../../hooks/useWallet.js';
import { formatCurrency } from '../../../utils/formatCurrency.js';

export default function Send() {
  const { t } = useOutletContext();
  const { balance, contacts, send } = useWallet();
  const [form, setForm] = useState({ recipient: '', amount: '' });
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await send(form.recipient, Number(form.amount));
      setSent(true);
      setForm({ recipient: '', amount: '' });
      setTimeout(() => setSent(false), 2500);
    } catch (err) {
      setError(err.message === 'INSUFFICIENT_BALANCE' ? t('send.insufficient') : t('set.soon'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="page-head reveal"><h1>{t('page.send')}</h1></div>
      <div className="form-panel-page reveal">
        <div className="available-balance">{t('send.available')}: <strong>{formatCurrency(balance)} so'm</strong></div>

        <div style={{ marginBottom: 8, fontSize: 13.5, fontWeight: 600, color: 'var(--text-secondary)' }}>{t('send.recent')}</div>
        <div className="recent-recipients">
          {contacts.map((r) => (
            <div className="recipient-pill" key={r.id} onClick={() => setForm({ ...form, recipient: r.name })}>
              <div className="avatar" style={{ background: r.grad }}>{r.initials}</div>
              <span>{r.name}</span>
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>{t('send.recipient')}</label>
            <input type="text" placeholder="+998 90 123 45 67" value={form.recipient} onChange={(e) => setForm({ ...form, recipient: e.target.value })} required />
          </div>
          <div className="field">
            <label>{t('send.amount')}</label>
            <div className="amount-input">
              <input
                type="text"
                inputMode="numeric"
                placeholder="0"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value.replace(/[^0-9]/g, '') })}
                required
              />
              <span className="cur-suffix">so'm</span>
            </div>
          </div>
          {error && <div className="pw-msg">{error}</div>}
          <button type="submit" className="btn-primary-full" disabled={busy}>
            {sent ? '✓ ' + t('receive.copied') : (<><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="m22 2-7 20-4-9-9-4 20-7Z" /></svg>{t('send.btn')}</>)}
          </button>
        </form>
      </div>
    </>
  );
}
