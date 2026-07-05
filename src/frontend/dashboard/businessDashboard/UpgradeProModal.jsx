import { useState } from 'react';
import CardPicker from '../../shared/CardPicker.jsx';
import { isCardPickerValid } from '../../../utils/cardValidation.js';

const checkIc = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6 9 17l-5-5" /></svg>;
const EMPTY_CARD = { cardNumber: '', expiry: '', cvv: '', cardholderName: '', cardKind: 'international' };

// Biznes dashboard obunasi — marketing + reja tanlash oynasi.
// `mandatory` = true bo'lsa (obuna faol emasligi sababli majburiy ko'rsatilsa),
// yopish tugmasi yo'q, faqat "shaxsiy profilga qaytish" orqali chiqish mumkin.
// To'lov haqiqiy karta ma'lumotlarini talab qiladi (Luhn/muddat backend'da
// tekshiriladi) — haqiqiy to'lov provayderi ulanmagani uchun undirish simulyatsiya
// qilinadi, lekin karta doim tekshiriladi va foydalanuvchining kartalari ro'yxatiga qo'shiladi.
export default function UpgradeProModal({ show, onClose, onSubscribe, onBack, mandatory, currentPlan, cards, t }) {
  const [plan, setPlan] = useState(currentPlan || 'monthly');
  const [selectedCard, setSelectedCard] = useState('new');
  const [cardForm, setCardForm] = useState(EMPTY_CARD);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const handlePay = async () => {
    setBusy(true);
    setError('');
    try {
      const payload = selectedCard !== 'new' ? { cardId: selectedCard } : {
        cardNumber: cardForm.cardNumber, expiry: cardForm.expiry, cardholderName: cardForm.cardholderName,
      };
      await onSubscribe(plan, payload);
      if (!mandatory) onClose();
    } catch {
      setError(t('pro.error'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={`modal-overlay ${show ? 'show' : ''}`} onClick={(e) => { if (!mandatory && e.target === e.currentTarget) onClose(); }}>
      <div className="modal pro-modal">
        <div className="modal-head">
          <h3>{t('pro.title')}</h3>
          {!mandatory && (
            <button className="modal-close" onClick={onClose}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12" /></svg></button>
          )}
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: 13.5, marginTop: -8, marginBottom: 18 }}>{t('pro.sub')}</p>
        <ul className="pro-features">
          <li>{checkIc}<span>{t('pro.f1')}</span></li>
          <li>{checkIc}<span>{t('pro.f2')}</span></li>
          <li>{checkIc}<span>{t('pro.f3')}</span></li>
          <li>{checkIc}<span>{t('pro.f4')}</span></li>
        </ul>
        <div className="plan-cards">
          <button type="button" className={`plan-card ${plan === 'monthly' ? 'active' : ''}`} onClick={() => setPlan('monthly')}>
            <div className="plan-name">{t('sub.monthly')}</div>
            <div className="plan-price">{t('sub.priceMonthly')}</div>
          </button>
          <button type="button" className={`plan-card ${plan === 'yearly' ? 'active' : ''}`} onClick={() => setPlan('yearly')}>
            <span className="plan-badge">{t('sub.save')}</span>
            <div className="plan-name">{t('sub.yearly')}</div>
            <div className="plan-price">{t('sub.priceYearly')}</div>
          </button>
        </div>
        <CardPicker cards={(cards || []).filter((c) => !c.frozen)} selected={selectedCard} onSelect={setSelectedCard} cardForm={cardForm} onCardFormChange={setCardForm} t={t} />
        {error && <div className="pw-msg">{error}</div>}
        <button type="button" className="btn-new" style={{ width: '100%', justifyContent: 'center' }} onClick={handlePay} disabled={busy || !isCardPickerValid(selectedCard, cardForm)}>
          {busy ? '...' : t('pro.btn')}
        </button>
        {mandatory && onBack && (
          <button type="button" className="btn-ghost" style={{ width: '100%', justifyContent: 'center', marginTop: 10 }} onClick={onBack} disabled={busy}>
            {t('sub.back')}
          </button>
        )}
      </div>
    </div>
  );
}
