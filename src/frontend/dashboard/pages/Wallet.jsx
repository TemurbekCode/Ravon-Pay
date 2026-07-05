import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useWallet } from '../../../hooks/useWallet.js';
import { formatCurrency } from '../../../utils/formatCurrency.js';
import { isCardFormValid } from '../../../utils/cardValidation.js';
import CardForm from '../../shared/CardForm.jsx';

const EMPTY_CARD = { cardNumber: '', expiry: '', cvv: '', cardholderName: '', cardKind: 'international' };

export default function Wallet() {
  const { t } = useOutletContext();
  const { balance, cards, transactions, addCard } = useWallet();
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
      <div className="page-head reveal">
        <h1>{t('page.wallet')}</h1>
        <p>{t('wallet.cards')}</p>
      </div>

      <div className="wallet-cards-grid">
        {cards.map((c) => (
          <div className={`credit-card ${c.variant} ${c.frozen ? 'frozen' : ''} reveal`} key={c.id}>
            <div className="cc-top">
              <div><div className="cc-type">{c.type}</div></div>
              <div className="cc-chip" />
            </div>
            <div className="cc-num">{c.num}</div>
            {c.holder && <div className="cc-holder">{c.holder}</div>}
            <div className="cc-bottom">
              <div>
                <div className="cc-label">{t('cards.balance')}</div>
                <div className="cc-val">{formatCurrency(balance)} so'm</div>
              </div>
              <div>
                <div className="cc-label">{t('cards.expires')}</div>
                <div className="cc-val">{c.exp}</div>
              </div>
              <div className="cc-brand">{c.type?.toUpperCase()}</div>
            </div>
          </div>
        ))}
        <button className="add-card-btn reveal" onClick={() => setModalOpen(true)}>
          <span className="plus"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg></span>
          {t('wallet.addcard')}
        </button>
      </div>

      <div className="panel reveal">
        <div className="panel-head"><div className="panel-title">{t('wallet.history')}</div></div>
        <div className="tx-list">
          {transactions.slice(0, 6).map((h) => (
            <div className="tx-row" key={h.id}>
              <div className={`tx-icon ${h.type}`}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">{h.type === 'in' ? <path d="M12 19V5m-7 7 7-7 7 7" /> : h.type === 'card' ? <><rect x="2" y="5" width="20" height="14" rx="2" /><path d="M2 10h20" /></> : <path d="M12 5v14m7-7-7 7-7-7" />}</svg>
              </div>
              <div className="tx-info"><div className="tx-name">{h.name}</div><div className="tx-meta"><span>{h.date}</span></div></div>
              <div className={`tx-amount ${h.amount > 0 ? 'in' : ''}`}>{h.amount > 0 ? '+' : ''}{formatCurrency(h.amount)}</div>
            </div>
          ))}
        </div>
      </div>

      <div className={`modal-overlay ${modalOpen ? 'show' : ''}`} onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}>
        <div className="modal">
          <div className="modal-head">
            <h3>{t('wallet.addcard')}</h3>
            <button className="modal-close" onClick={closeModal}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12" /></svg></button>
          </div>
          <form onSubmit={submitAddCard}>
            <CardForm value={form} onChange={setForm} t={t} />
            {error && <div className="inline-form-error">{error}</div>}
            <button type="submit" className="btn-primary-full" disabled={busy || !isCardFormValid(form)}>
              {busy ? '...' : t('wallet.addcard')}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
