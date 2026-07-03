import { useState } from 'react';
import './CardForm.scss';
import {
  formatCardNumber, formatExpiry, detectCardType,
  isCardNumberValid, isExpiryValid, isCvvValid, isHolderValid,
} from '../../utils/cardValidation.js';

// Karta ulash uchun umumiy forma — haqiqiy karta raqami, amal qilish muddati,
// CVV va egasining ismini so'raydi. Register, Wallet, Cards va biznes profil
// faollashtirish oynalarida bir xil shaklda ishlatiladi.
//
// Har bir maydon ekrandan chiqqanda (blur) tekshiriladi — noto'g'ri bo'lsa qizil
// outline va xatolik matni, to'g'ri bo'lsa yashil outline ko'rsatiladi. Bir marta
// tekshirilgan maydon keyingi har bir bosishda ham jonli yangilanadi.
//
// CVV hech qachon backend'ga yuborilmaydi (haqiqiy to'lov provayderi bo'lmagani
// uchun uni saqlashning hech qanday keragi yo'q — bu real ilovalardagi kabi
// "CVV faqat to'lov shlyuziga boradi, hech qachon serverda saqlanmaydi" qoidasiga mos).
export default function CardForm({ value, onChange, t }) {
  const type = detectCardType(value.cardNumber);
  const [touched, setTouched] = useState({ number: false, expiry: false, cvv: false, holder: false });
  const touch = (field) => setTouched((tt) => ({ ...tt, [field]: true }));

  const numberValid = isCardNumberValid(value.cardNumber);
  const expiryValidNow = isExpiryValid(value.expiry);
  const cvvValidNow = isCvvValid(value.cvv);
  const holderValidNow = isHolderValid(value.cardholderName);

  const cls = (isTouched, isValid) => (isTouched ? (isValid ? 'valid' : 'invalid') : '');

  return (
    <div className="cardform">
      <div className="cardform-field">
        <label>{t('cardform.number')}</label>
        <div className="cardform-number-wrap">
          <input
            type="text"
            inputMode="numeric"
            placeholder="8600 1234 5678 9012"
            className={cls(touched.number, numberValid)}
            value={value.cardNumber}
            onChange={(e) => onChange({ ...value, cardNumber: formatCardNumber(e.target.value) })}
            onBlur={() => touch('number')}
          />
          {type && <span className="cardform-badge">{type}</span>}
        </div>
        {touched.number && !numberValid && <div className="cardform-error">{t('cardform.err.number')}</div>}
      </div>
      <div className="cardform-row">
        <div className="cardform-field">
          <label>{t('cardform.expiry')}</label>
          <input
            type="text"
            inputMode="numeric"
            placeholder="OO/YY"
            className={cls(touched.expiry, expiryValidNow)}
            value={value.expiry}
            onChange={(e) => onChange({ ...value, expiry: formatExpiry(e.target.value) })}
            onBlur={() => touch('expiry')}
          />
          {touched.expiry && !expiryValidNow && <div className="cardform-error">{t('cardform.err.expiry')}</div>}
        </div>
        <div className="cardform-field">
          <label>CVV</label>
          <input
            type="password"
            inputMode="numeric"
            placeholder="123"
            maxLength={3}
            className={cls(touched.cvv, cvvValidNow)}
            value={value.cvv}
            onChange={(e) => onChange({ ...value, cvv: e.target.value.replace(/\D/g, '').slice(0, 3) })}
            onBlur={() => touch('cvv')}
          />
          {touched.cvv && !cvvValidNow && <div className="cardform-error">{t('cardform.err.cvv')}</div>}
        </div>
      </div>
      <div className="cardform-field">
        <label>{t('cardform.holder')}</label>
        <input
          type="text"
          placeholder={t('cardform.holderPlaceholder')}
          className={cls(touched.holder, holderValidNow)}
          value={value.cardholderName}
          onChange={(e) => onChange({ ...value, cardholderName: e.target.value.toUpperCase() })}
          onBlur={() => touch('holder')}
        />
        {touched.holder && !holderValidNow && <div className="cardform-error">{t('cardform.err.holder')}</div>}
      </div>
    </div>
  );
}
