import { useState } from 'react';

// Umumiy "Yangi X qo'shish" modal — Links/Invoices/Checkout/Team sahifalari shu componentdan foydalanadi.
export default function CreateItemModal({ show, onClose, title, fields, onSubmit, submitLabel, t }) {
  const [values, setValues] = useState({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [prevShow, setPrevShow] = useState(show);

  if (show !== prevShow) {
    setPrevShow(show);
    if (!show) { setValues({}); setError(''); }
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await onSubmit(values);
      onClose();
    } catch {
      setError(t('form.error'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={`modal-overlay ${show ? 'show' : ''}`} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal">
        <div className="modal-head">
          <h3>{title}</h3>
          <button className="modal-close" onClick={onClose}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12" /></svg></button>
        </div>
        <form onSubmit={handleSubmit}>
          {fields.map((f) => (
            <div className="biz-field" key={f.name}>
              <label>{f.label}</label>
              <input
                type={f.type || 'text'}
                placeholder={f.placeholder}
                value={values[f.name] || ''}
                onChange={(e) => setValues((v) => ({ ...v, [f.name]: e.target.value }))}
                required
              />
            </div>
          ))}
          {error && <div className="pw-msg">{error}</div>}
          <button type="submit" className="btn-new" style={{ width: '100%', justifyContent: 'center' }} disabled={busy}>{submitLabel}</button>
        </form>
      </div>
    </div>
  );
}
