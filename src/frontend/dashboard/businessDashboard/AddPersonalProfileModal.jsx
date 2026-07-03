import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth.js';
import { cardService } from '../../../services/cardService.js';
import { isCardPickerValid } from '../../../utils/cardValidation.js';
import CardPicker from '../../shared/CardPicker.jsx';
import { ROUTES } from '../../../utils/constants.js';

const EMPTY_CARD = { cardNumber: '', expiry: '', cvv: '', cardholderName: '' };

// Foydalanuvchida hali shaxsiy (hamyon) profil bo'lmasa — to'liq qayta ro'yxatdan
// o'tkazmasdan, karta ulash (yoki o'tkazib yuborish) qadami bilan faollashtiradi.
// Agar hisobda allaqachon karta bo'lsa (masalan obuna to'lovidan qolgan) — uni
// qayta kiritish shart emas, ro'yxatdan tanlash mumkin.
export default function AddPersonalProfileModal({ show, onClose, t }) {
  const { activateProfile } = useAuth();
  const navigate = useNavigate();
  const [cards, setCards] = useState([]);
  const [selectedCard, setSelectedCard] = useState('new');
  const [cardForm, setCardForm] = useState(EMPTY_CARD);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [prevShow, setPrevShow] = useState(show);

  useEffect(() => {
    if (!show) return;
    cardService.listCards().then((res) => {
      const active = (res.cards ?? []).filter((c) => !c.frozen);
      setCards(active);
      setSelectedCard(active[0]?.id || 'new');
    }).catch(() => {});
  }, [show]);

  if (show !== prevShow) {
    setPrevShow(show);
    if (show) { setCardForm(EMPTY_CARD); setError(''); }
  }

  const finish = async (withCard) => {
    setBusy(true);
    setError('');
    try {
      await activateProfile('personal', {});
      if (withCard && selectedCard === 'new') await cardService.createCard(cardForm);
      navigate(ROUTES.dashboard);
      onClose();
    } catch {
      setError(withCard ? t('cardform.invalid') : t('addpersonal.error'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={`modal-overlay ${show ? 'show' : ''}`} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal">
        <div className="modal-head">
          <h3>{t('addpersonal.title')}</h3>
          <button className="modal-close" onClick={onClose}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12" /></svg></button>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: 13.5, marginBottom: 18, marginTop: -8 }}>{t('addpersonal.sub')}</p>
        <form onSubmit={(e) => { e.preventDefault(); finish(true); }}>
          <CardPicker cards={cards} selected={selectedCard} onSelect={setSelectedCard} cardForm={cardForm} onCardFormChange={setCardForm} t={t} />
          {error && <div className="pw-msg">{error}</div>}
          <button type="submit" className="btn-new" style={{ width: '100%', justifyContent: 'center', marginBottom: 10 }} disabled={busy || !isCardPickerValid(selectedCard, cardForm)}>
            {t('addpersonal.connect')}
          </button>
        </form>
        <button type="button" className="btn-ghost" style={{ width: '100%', justifyContent: 'center' }} disabled={busy} onClick={() => finish(false)}>
          {t('addpersonal.skip')}
        </button>
      </div>
    </div>
  );
}
