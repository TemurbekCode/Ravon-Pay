import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useAuth } from '../../../../hooks/useAuth.js';
import { useBusiness } from '../../../../hooks/useBusiness.js';
import { formatCurrency, uzsToUsd } from '../../../../utils/formatCurrency.js';
import { isCardPickerValid } from '../../../../utils/cardValidation.js';
import CardPicker from '../../../shared/CardPicker.jsx';

const EMPTY_CARD = { cardNumber: '', expiry: '', cvv: '', cardholderName: '', cardKind: 'international' };

export default function Balance() {
  const { t } = useOutletContext();
  const { request2FAChallenge } = useAuth();
  const { balance, revenue, payouts, withdraw, cards, addCard } = useBusiness();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [selectedCard, setSelectedCard] = useState('new');
  const [cardForm, setCardForm] = useState(EMPTY_CARD);
  const [awaitingTwoFa, setAwaitingTwoFa] = useState(false);
  const [twoFaCode, setTwoFaCode] = useState('');
  const [twoFaDevCode, setTwoFaDevCode] = useState('');

  const openWithdraw = () => {
    setOpen((v) => {
      const next = !v;
      if (next) { setSelectedCard(cards[0]?.id || 'new'); setCardForm(EMPTY_CARD); }
      setAwaitingTwoFa(false); setTwoFaCode(''); setTwoFaDevCode('');
      return next;
    });
  };

  const submitWithdraw = async (e) => {
    e.preventDefault();
    setError('');
    const n = Number(amount);
    if (!n || (!awaitingTwoFa && !isCardPickerValid(selectedCard, cardForm))) return;
    setBusy(true);
    try {
      const cardId = selectedCard !== 'new' ? selectedCard : (await addCard(cardForm)).id;
      await withdraw(n, cardId, twoFaCode || undefined);
      setOpen(false);
      setAmount('');
    } catch (err) {
      if (err.message === '2FA_REQUIRED') {
        setAwaitingTwoFa(true);
        try { setTwoFaDevCode((await request2FAChallenge()).devCode || ''); } catch { /* real SMS bo'lsa devCode bo'lmaydi */ }
      } else if (err.message === 'INSUFFICIENT_BALANCE') {
        setError(t('send.insufficient'));
      } else if (err.message === "Kod noto'g'ri" || /muddati tugagan/.test(err.message || '')) {
        setError(err.message);
      } else {
        setError(t('set.soon'));
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="page-head reveal"><div><h1>{t('page.balance')}</h1></div></div>

      <div className="rev-grid">
        <div className="rev-card reveal">
          <div className="lbl">{t('balance.available')}</div>
          <div className="amt">{formatCurrency(balance.available)} <span className="cur">so'm</span></div>
          <div className="usd">≈ ${uzsToUsd(balance.available)} USD</div>
          <div className="foot"><button className="chip" style={{ cursor: 'pointer' }} onClick={openWithdraw}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 19V5m7 7-7 7-7-7" /></svg>{t('balance.payout')}</button></div>
          {open && (
            <form className="inline-amount-form" onSubmit={submitWithdraw}>
              <input
                type="text"
                inputMode="numeric"
                autoFocus
                placeholder={t('send.amount')}
                value={amount}
                onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, ''))}
              />
              {!awaitingTwoFa && (
                <CardPicker cards={cards} selected={selectedCard} onSelect={setSelectedCard} cardForm={cardForm} onCardFormChange={setCardForm} t={t} />
              )}
              {awaitingTwoFa && (
                <>
                  <input
                    type="text"
                    inputMode="numeric"
                    autoFocus
                    maxLength={4}
                    placeholder={t('otp.codePh')}
                    value={twoFaCode}
                    onChange={(e) => setTwoFaCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  />
                  {twoFaDevCode && <div className="inline-form-hint">{t('otp.demo')} {twoFaDevCode}</div>}
                </>
              )}
              <button type="submit" disabled={busy || (!awaitingTwoFa && !isCardPickerValid(selectedCard, cardForm))}>
                {awaitingTwoFa ? t('otp.verify') : t('balance.payout')}
              </button>
              <button type="button" className="ghost" onClick={() => setOpen(false)}>{t('set.cancel')}</button>
              {error && <div className="inline-form-error">{error}</div>}
            </form>
          )}
        </div>
        <div className="kpi reveal">
          <div className="kpi-top"><span className="kpi-ic amber"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg></span></div>
          <div className="kpi-val">{formatCurrency(balance.pending)}</div>
          <div className="kpi-lbl">{t('balance.pending')}</div>
        </div>
        <div className="kpi reveal">
          <div className="kpi-top"><span className="kpi-ic green"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg></span></div>
          <div className="kpi-val">{formatCurrency(revenue)}</div>
          <div className="kpi-lbl">{t('rev.label')}</div>
        </div>
      </div>

      <div className="panel reveal">
        <div className="panel-head"><div className="panel-title">{t('balance.history')}</div></div>
        <div className="tbl-wrap">
          <table className="tbl">
            <thead><tr><th>{t('balance.payout')}</th><th>{t('th.status')}</th><th>{t('th.date')}</th><th className="right">{t('th.amount')}</th></tr></thead>
            <tbody>
              {payouts.map((p) => (
                <tr key={p.id}><td>{p.name}</td><td><span className={`pill ${p.status}`}>{t('st.' + p.status)}</span></td><td>{p.date}</td><td className="right amt">{formatCurrency(p.amount)}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
