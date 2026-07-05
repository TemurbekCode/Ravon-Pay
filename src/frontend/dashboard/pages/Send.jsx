import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useWallet } from '../../../hooks/useWallet.js';
import { formatCurrency } from '../../../utils/formatCurrency.js';
import { formatCardNumber, isCardNumberValid } from '../../../utils/cardValidation.js';

const EMPTY_FORM = { recipientType: 'phone', recipient: '', amount: '' };

export default function Send() {
  const { t } = useOutletContext();
  const { balance, contacts, send } = useWallet();
  const [form, setForm] = useState(EMPTY_FORM);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const setKind = (recipientType) => setForm({ ...form, recipientType, recipient: '' });

  const recipientValid = form.recipientType === 'phone'
    ? form.recipient.length === 9
    : isCardNumberValid(form.recipient);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await send(form.recipient, Number(form.amount), form.recipientType);
      setSent(true);
      setForm({ ...EMPTY_FORM, recipientType: form.recipientType });
      setTimeout(() => setSent(false), 2500);
    } catch (err) {
      if (err.message === 'INSUFFICIENT_BALANCE') setError(t('send.insufficient'));
      else if (err.message === 'RECIPIENT_NOT_FOUND') setError(t('send.recipientNotFound'));
      else setError(err.message || t('set.soon'));
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
            <div
              className="recipient-pill"
              key={r.id}
              onClick={() => setForm({ ...form, recipientType: 'phone', recipient: (r.phone || '').replace(/\D/g, '').slice(-9) })}
            >
              <div className="avatar" style={{ background: r.grad }}>{r.initials}</div>
              <span>{r.name}</span>
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          <div className="cardform-kind">
            <button type="button" className={form.recipientType === 'phone' ? 'active' : ''} onClick={() => setKind('phone')}>
              {t('send.byPhone')}
            </button>
            <button type="button" className={form.recipientType === 'card' ? 'active' : ''} onClick={() => setKind('card')}>
              {t('send.byCard')}
            </button>
          </div>
          <div className="field">
            <label>{t('send.recipient')}</label>
            {form.recipientType === 'phone' ? (
              <div className="phone-input-wrap">
                <span className="prefix">+998</span>
                <input
                  type="tel"
                  placeholder="90 123 45 67"
                  value={form.recipient}
                  onChange={(e) => setForm({ ...form, recipient: e.target.value.replace(/\D/g, '').slice(0, 9) })}
                  required
                />
              </div>
            ) : (
              <input
                type="text"
                inputMode="numeric"
                placeholder="8600 1234 5678 9012"
                value={form.recipient}
                onChange={(e) => setForm({ ...form, recipient: formatCardNumber(e.target.value) })}
                required
              />
            )}
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
          <button type="submit" className="btn-primary-full" disabled={busy || !recipientValid || !Number(form.amount)}>
            {sent ? '✓ ' + t('receive.copied') : (<><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="m22 2-7 20-4-9-9-4 20-7Z" /></svg>{t('send.btn')}</>)}
          </button>
        </form>
      </div>
    </>
  );
}
