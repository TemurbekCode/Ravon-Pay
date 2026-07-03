import { useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';

const RATES = [
  { code: 'USD', flag: '🇺🇸', buy: 12640, sell: 12680, pct: 0.4 },
  { code: 'EUR', flag: '🇪🇺', buy: 13720, sell: 13790, pct: -0.2 },
  { code: 'RUB', flag: '🇷🇺', buy: 128, sell: 131, pct: 0.6 },
  { code: 'GBP', flag: '🇬🇧', buy: 16050, sell: 16130, pct: 0.1 },
];

export default function Exchange() {
  const { t } = useOutletContext();
  const [amount, setAmount] = useState('100');
  const [from, setFrom] = useState('USD');
  const [to, setTo] = useState('UZS');

  const rateFor = (code) => RATES.find((r) => r.code === code)?.sell ?? 1;

  const result = useMemo(() => {
    const n = Number(amount.replace(/[^0-9.]/g, '')) || 0;
    if (from === to) return n;
    if (from === 'UZS') return n / rateFor(to);
    if (to === 'UZS') return n * rateFor(from);
    return (n * rateFor(from)) / rateFor(to);
  }, [amount, from, to]);

  const swap = () => { setFrom(to); setTo(from); };

  return (
    <>
      <div className="page-head reveal">
        <h1>{t('page.exchange')}</h1>
        <p>{t('exchange.sub')}</p>
      </div>

      <div className="stats">
        {RATES.map((r) => (
          <div className="stat reveal" key={r.code}>
            <div className="top">
              <span className="ic" style={{ fontSize: 20, background: 'none' }}>{r.flag}</span>
              <span className={`pct ${r.pct >= 0 ? 'up' : 'down'}`}>{r.pct >= 0 ? '+' : ''}{r.pct}%</span>
            </div>
            <div className="num">{r.sell.toLocaleString('ru-RU')}</div>
            <div className="cap">1 {r.code} → so'm</div>
          </div>
        ))}
      </div>

      <div className="panel reveal">
        <div className="panel-head">
          <div>
            <div className="panel-title">{t('exchange.conv')}</div>
            <div className="panel-sub">{t('exchange.convSub')}</div>
          </div>
        </div>

        <div className="fx-converter">
          <div className="fx-box">
            <label>{t('exchange.from')}</label>
            <div className="fx-input-row">
              <input type="text" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ''))} />
              <select value={from} onChange={(e) => setFrom(e.target.value)}>
                <option value="UZS">UZS</option>
                {RATES.map((r) => <option key={r.code} value={r.code}>{r.code}</option>)}
              </select>
            </div>
          </div>

          <button type="button" className="fx-swap" onClick={swap} aria-label="Swap">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M7 16V4m0 0L3 8m4-4 4 4" /><path d="M17 8v12m0 0 4-4m-4 4-4-4" /></svg>
          </button>

          <div className="fx-box">
            <label>{t('exchange.to')}</label>
            <div className="fx-input-row">
              <input type="text" readOnly value={result.toLocaleString('ru-RU', { maximumFractionDigits: 2 })} />
              <select value={to} onChange={(e) => setTo(e.target.value)}>
                <option value="UZS">UZS</option>
                {RATES.map((r) => <option key={r.code} value={r.code}>{r.code}</option>)}
              </select>
            </div>
          </div>
        </div>
        <p className="fx-note">{t('exchange.note')}</p>
      </div>
    </>
  );
}
