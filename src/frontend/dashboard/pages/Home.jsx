import { useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth.js';
import { useWallet } from '../../../hooks/useWallet.js';
import { ROUTES } from '../../../utils/constants.js';
import { formatCurrency, uzsToUsd } from '../../../utils/formatCurrency.js';
import { isCardPickerValid } from '../../../utils/cardValidation.js';
import CardPicker from '../../shared/CardPicker.jsx';
import CashFlowChart from '../userDashboard/CashFlowChart.jsx';

const EMPTY_CARD = { cardNumber: '', expiry: '', cvv: '', cardholderName: '' };

const TX_ICONS = {
  in: <path d="M12 19V5m-7 7 7-7 7 7" />,
  out: <path d="m22 2-7 20-4-9-9-4 20-7Z" />,
  card: <><rect x="2" y="5" width="20" height="14" rx="2" /><path d="M2 10h20" /></>,
};

function compact(n) {
  const abs = Math.abs(n);
  if (abs >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  return formatCurrency(n);
}

export default function Home() {
  const { t } = useOutletContext();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { balance, contacts, transactions, topUp, withdraw, addCard, addContact, cards } = useWallet();
  const [balanceVisible, setBalanceVisible] = useState(true);

  const [action, setAction] = useState(null); // null | 'topup' | 'withdraw'
  const [amount, setAmount] = useState('');
  const [actionError, setActionError] = useState('');
  const [actionBusy, setActionBusy] = useState(false);
  const [selectedCard, setSelectedCard] = useState('new');
  const [cardForm, setCardForm] = useState(EMPTY_CARD);

  const [contactOpen, setContactOpen] = useState(false);
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');

  const fullName = user?.fullName || 'Aziz Karimov';

  const totalIn = transactions.filter((tx) => tx.amount > 0).reduce((s, tx) => s + tx.amount, 0);
  const totalOut = transactions.filter((tx) => tx.amount < 0).reduce((s, tx) => s + tx.amount, 0);
  const pendingCount = transactions.filter((tx) => tx.status === 'pending').length;
  const activeCardsCount = cards.filter((c) => !c.frozen).length;

  const openAction = (type) => {
    setAction(type);
    setAmount('');
    setActionError('');
    setSelectedCard(cards[0]?.id || 'new');
    setCardForm(EMPTY_CARD);
  };
  const closeAction = () => { setAction(null); setAmount(''); setActionError(''); };

  const submitAction = async (e) => {
    e.preventDefault();
    const n = Number(amount);
    if (!n) return;
    if (action === 'withdraw' && !isCardPickerValid(selectedCard, cardForm)) return;
    setActionBusy(true);
    setActionError('');
    try {
      if (action === 'topup') {
        await topUp(n);
      } else {
        const cardId = selectedCard !== 'new' ? selectedCard : (await addCard(cardForm)).id;
        await withdraw(n, cardId);
      }
      closeAction();
    } catch (err) {
      setActionError(err.message === 'INSUFFICIENT_BALANCE' ? t('send.insufficient') : t('set.soon'));
    } finally {
      setActionBusy(false);
    }
  };

  const submitContact = async (e) => {
    e.preventDefault();
    if (!contactName.trim() || !contactPhone.trim()) return;
    await addContact(contactName.trim(), contactPhone.trim());
    setContactOpen(false);
    setContactName('');
    setContactPhone('');
  };

  return (
    <>
      <div className="greet reveal">
        <h1>{fullName}</h1>
        <p>{t('greet.sub')}</p>
      </div>

      {/* BALANS + MINI CARDS */}
      <div className="balance-row">
        <div className="balance-card reveal">
          <div className="balance-top">
            <div>
              <div className="balance-label">
                <span>{t('bal.total')}</span>
                <span className="eye" onClick={() => setBalanceVisible((v) => !v)}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></svg>
                </span>
              </div>
              <div className={`balance-amount ${!balanceVisible ? 'hidden' : ''}`}>
                {balanceVisible ? <>{formatCurrency(balance)} <span className="cur">so'm</span></> : "•••••••"}
              </div>
              <div className="balance-usd">{balanceVisible ? `≈ $${uzsToUsd(balance)} USD` : '≈ $••••'}</div>
            </div>
            <div className="balance-card-brand">
              <svg viewBox="0 0 24 24" fill="none"><path d="M4 7h11a4 4 0 0 1 0 8H8m0 0 3 3m-3-3 3-3" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </div>
          </div>
          <span className="balance-change">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M7 17 17 7m0 0H9m8 0v8" /></svg>
            {t('bal.change')}
          </span>
          <div className="balance-actions">
            <button className="bal-btn" onClick={() => navigate(ROUTES.send)}>
              <span className="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="m22 2-7 20-4-9-9-4 20-7Z" /></svg></span>
              <span>{t('bal.send')}</span>
            </button>
            <button className="bal-btn" onClick={() => navigate(ROUTES.receive)}>
              <span className="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M12 5v14m-7-7 7 7 7-7" /></svg></span>
              <span>{t('bal.receive')}</span>
            </button>
            <button className="bal-btn" onClick={() => openAction('topup')}>
              <span className="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M12 5v14M5 12h14" /></svg></span>
              <span>{t('bal.topup')}</span>
            </button>
            <button className="bal-btn" onClick={() => openAction('withdraw')}>
              <span className="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M12 19V5m7 7-7 7-7-7" /></svg></span>
              <span>{t('bal.withdraw')}</span>
            </button>
          </div>

          {action && (
            <form className="inline-amount-form" onSubmit={submitAction}>
              <input
                type="text"
                inputMode="numeric"
                autoFocus
                placeholder={t('send.amount')}
                value={amount}
                onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, ''))}
              />
              {action === 'withdraw' && (
                <CardPicker cards={cards} selected={selectedCard} onSelect={setSelectedCard} cardForm={cardForm} onCardFormChange={setCardForm} t={t} />
              )}
              <button type="submit" disabled={actionBusy || (action === 'withdraw' && !isCardPickerValid(selectedCard, cardForm))}>
                {action === 'topup' ? t('bal.topup') : t('bal.withdraw')}
              </button>
              <button type="button" className="ghost" onClick={closeAction}>{t('set.cancel')}</button>
              {actionError && <div className="inline-form-error">{actionError}</div>}
            </form>
          )}
        </div>

        <div className="mini-stack">
          <div className="mini-card reveal">
            <div className="mini-icon in"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 19V5m-7 7 7-7 7 7" /></svg></div>
            <div className="mini-info"><div className="lbl">{t('mini.in')}</div><div className="val">+{compact(totalIn)}</div></div>
          </div>
          <div className="mini-card reveal">
            <div className="mini-icon out"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14m7-7-7 7-7-7" /></svg></div>
            <div className="mini-info"><div className="lbl">{t('mini.out')}</div><div className="val">{compact(totalOut)}</div></div>
          </div>
        </div>
      </div>

      {/* STAT CARDS */}
      <div className="stats">
        <div className="stat reveal">
          <div className="top"><span className="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3v18h18" /><path d="m7 14 3-3 4 4 5-5" /></svg></span></div>
          <div className="num">{transactions.length}</div><div className="cap">{t('stat.tx')}</div>
        </div>
        <div className="stat reveal">
          <div className="top"><span className="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></svg></span></div>
          <div className="num">{contacts.length}</div><div className="cap">{t('stat.contacts')}</div>
        </div>
        <div className="stat reveal">
          <div className="top"><span className="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="5" width="20" height="14" rx="2" /><path d="M2 10h20" /></svg></span></div>
          <div className="num">{activeCardsCount}</div><div className="cap">{t('stat.cards')}</div>
        </div>
        <div className="stat reveal">
          <div className="top"><span className="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg></span></div>
          <div className="num">{pendingCount}</div><div className="cap">{t('stat.pending')}</div>
        </div>
      </div>

      {/* CHART + QUICK SEND */}
      <div className="grid-2">
        <CashFlowChart t={t} />
        <div className="panel reveal">
          <div className="panel-head"><div><div className="panel-title">{t('quick.title')}</div></div></div>
          <div className="quick-contacts">
            {contacts.map((c) => (
              <div className="contact-row" key={c.id} onClick={() => navigate(ROUTES.send)}>
                <div className="avatar" style={{ background: c.grad }}>{c.initials}</div>
                <div className="ci"><div className="cn">{c.name}</div><div className="cm">{c.phone}</div></div>
                <div className="send-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M5 12h14m-7-7 7 7-7 7" /></svg></div>
              </div>
            ))}
            {contactOpen ? (
              <form className="inline-contact-form" onSubmit={submitContact}>
                <input type="text" placeholder={t('profile.name')} value={contactName} onChange={(e) => setContactName(e.target.value)} autoFocus required />
                <input type="tel" placeholder={t('profile.phone')} value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} required />
                <div className="inline-contact-actions">
                  <button type="submit">{t('quick.add')}</button>
                  <button type="button" className="ghost" onClick={() => setContactOpen(false)}>{t('set.cancel')}</button>
                </div>
              </form>
            ) : (
              <button className="add-contact" onClick={() => setContactOpen(true)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg>{t('quick.add')}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* TRANSACTIONS */}
      <div className="panel reveal">
        <div className="panel-head">
          <div><div className="panel-title">{t('tx.title')}</div></div>
          <button className="chip-group" style={{ padding: '8px 16px', fontSize: 13, fontWeight: 600, color: 'var(--brand-glow)' }} onClick={() => navigate(ROUTES.history)}>
            {t('tx.all')}
          </button>
        </div>
        <div className="tx-list">
          {transactions.slice(0, 5).map((tx) => (
            <div className="tx-row" key={tx.id}>
              <div className={`tx-icon ${tx.type}`}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">{TX_ICONS[tx.type]}</svg></div>
              <div className="tx-info">
                <div className="tx-name">{tx.name}</div>
                <div className="tx-meta">
                  <span className="tx-date">{tx.date}</span>
                  <span className={`tx-status ${tx.status}`}>{t('tx.' + tx.status)}</span>
                </div>
              </div>
              <div className={`tx-amount ${tx.amount > 0 ? 'in' : ''}`}>{tx.amount > 0 ? '+' : ''}{formatCurrency(tx.amount)}</div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
