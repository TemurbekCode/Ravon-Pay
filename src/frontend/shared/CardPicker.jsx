import CardForm from './CardForm.jsx';
import './CardPicker.scss';

// Mavjud (saqlangan) kartalardan birini tanlash yoki yangi karta qo'shish —
// pul yechish va obuna to'lovi kabi "haqiqiy kartaga pul o'tkazish" talab
// qiladigan barcha joylarda ishlatiladi.
export default function CardPicker({ cards, selected, onSelect, cardForm, onCardFormChange, t }) {
  return (
    <div className="cardpicker">
      {cards.length > 0 && (
        <div className="cardpicker-list">
          {cards.map((c) => (
            <button
              type="button"
              key={c.id}
              className={`cardpicker-item ${selected === c.id ? 'active' : ''}`}
              onClick={() => onSelect(c.id)}
            >
              <span className="cardpicker-type">{c.type}</span>
              <span className="cardpicker-num">{c.num}</span>
            </button>
          ))}
          <button
            type="button"
            className={`cardpicker-item cardpicker-new ${selected === 'new' ? 'active' : ''}`}
            onClick={() => onSelect('new')}
          >
            <span className="cardpicker-plus">+</span> {t('cardpicker.new')}
          </button>
        </div>
      )}
      {(selected === 'new' || cards.length === 0) && (
        <CardForm value={cardForm} onChange={onCardFormChange} t={t} />
      )}
    </div>
  );
}
