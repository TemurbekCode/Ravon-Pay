import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useWallet } from '../../../hooks/useWallet.js';
import { formatCurrency } from '../../../utils/formatCurrency.js';
import { isCardFormValid } from '../../../utils/cardValidation.js';
import CardForm from '../../shared/CardForm.jsx';

const EMPTY_CARD = { cardNumber: '', expiry: '', cvv: '', cardholderName: '', cardKind: 'international' };

export default function Cards() {
  const { t } = useOutletContext();
  const { balance, cards, freezeCard, deleteCard, addCard } = useWallet();
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_CARD);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const closeModal = () => { setModalOpen(false); setForm(EMPTY_CARD); setError(''); };

  const submitAddCard = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await addCard(form);
      closeModal();
    } catch {
      setError(t('cardform.invalid'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="page-head reveal"><h1>{t('cards.title')}</h1></div>
      <div className="wallet-cards-grid">
        {cards.map((c) => (
          <div key={c.id}>
            <div className={`credit-card ${c.variant} ${c.frozen ? 'frozen' : ''} reveal`}>
              <div className="cc-top"><div className="cc-type">{c.type}</div><div className="cc-chip" /></div>
              <div className="cc-num">{c.num}</div>
              {c.holder && <div className="cc-holder">{c.holder}</div>}
              <div className="cc-bottom">
                <div><div className="cc-label">{t('cards.balance')}</div><div className="cc-val">{formatCurrency(balance)} so'm</div></div>
                <div><div className="cc-label">{t('cards.expires')}</div><div className="cc-val">{c.exp}</div></div>
                <div className="cc-brand">{c.type?.toUpperCase()}</div>
              </div>
            </div>
            <button className="tx-filter-btn" style={{ marginTop: 10, width: '100%' }} onClick={() => freezeCard(c.id)}>
              {c.frozen ? t('cards.frozen') : t('cards.freeze')}
            </button>
            {confirmDeleteId === c.id ? (
              <div className="delete-confirm" style={{ marginTop: 8 }}>
                <p>{t('set.deleteConfirm')}</p>
                <div className="delete-actions">
                  <button className="btn-ghost" onClick={() => setConfirmDeleteId(null)}>{t('set.cancel')}</button>
                  <button className="btn-danger" onClick={() => { deleteCard(c.id); setConfirmDeleteId(null); }}>{t('set.deleteConfirmBtn')}</button>
                </div>
              </div>
            ) : (
              <button className="tx-filter-btn" style={{ marginTop: 8, width: '100%', color: 'var(--error)' }} onClick={() => setConfirmDeleteId(c.id)}>
                {t('cards.delete')}
              </button>
            )}
          </div>
        ))}
        <button className="add-card-btn reveal" onClick={() => setModalOpen(true)}>
          <span className="plus"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg></span>
          {t('cards.add')}
        </button>
      </div>

      <div className={`modal-overlay ${modalOpen ? 'show' : ''}`} onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}>
        <div className="modal">
          <div className="modal-head">
            <h3>{t('cards.add')}</h3>
            <button className="modal-close" onClick={closeModal}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12" /></svg></button>
          </div>
          <form onSubmit={submitAddCard}>
            <CardForm value={form} onChange={setForm} t={t} />
            {error && <div className="inline-form-error">{error}</div>}
            <button type="submit" className="btn-primary-full" disabled={busy || !isCardFormValid(form)}>
              {busy ? '...' : t('cards.add')}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
