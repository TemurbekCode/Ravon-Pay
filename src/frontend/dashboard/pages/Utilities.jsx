import { useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useWallet } from '../../../hooks/useWallet.js';
import { formatCurrency } from '../../../utils/formatCurrency.js';
import { UTILITY_PROVIDERS, UTILITY_QUICK_AMOUNTS } from '../../../utils/utilityProviders.js';

const CATEGORIES = [
  { key: 'electricity', icon: <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8Z" /> },
  { key: 'gas', icon: <path d="M8.5 14.5A2.5 2.5 0 0 0 11 17a2.5 2.5 0 0 0 2.5-2.5c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7.5 7.5 0 1 1-15 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5Z" /> },
  { key: 'water', icon: <path d="M12 2.69s5.5 5.68 5.5 10.36a5.5 5.5 0 1 1-11 0C6.5 8.37 12 2.69 12 2.69Z" /> },
  { key: 'internet', icon: <><path d="M5 12.55a11 11 0 0 1 14.08 0" /><path d="M1.42 9a16 16 0 0 1 21.16 0" /><path d="M8.53 16.11a6 6 0 0 1 6.95 0" /><circle cx="12" cy="20" r="1" /></> },
  { key: 'mobile', icon: <><rect x="5" y="2" width="14" height="20" rx="2" /><path d="M12 18h.01" /></> },
];

export default function Utilities() {
  const { t } = useOutletContext();
  const { balance, transactions, payUtility } = useWallet();
  const [active, setActive] = useState(null);
  const [provider, setProvider] = useState('');
  const [account, setAccount] = useState('');
  const [amount, setAmount] = useState('');
  const [receipt, setReceipt] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const recentAccounts = useMemo(() => {
    const seen = new Set();
    const list = [];
    for (const tx of transactions) {
      if (!tx.name.includes('Kommunal')) continue;
      const m = tx.name.match(/\(([^)]+)\)\s*$/);
      if (m && !seen.has(m[1])) { seen.add(m[1]); list.push(m[1]); }
      if (list.length >= 4) break;
    }
    return list;
  }, [transactions]);

  const select = (key) => {
    setActive(key);
    setProvider(UTILITY_PROVIDERS[key][0]);
    setAccount('');
    setAmount('');
    setError('');
    setReceipt(null);
  };

  const handlePay = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const categoryLabel = `${t('util.' + active)} — ${provider}`;
      const res = await payUtility(categoryLabel, account, Number(amount));
      setReceipt({ provider, account, amount: Number(amount), date: res.transactions[0]?.date || '' });
    } catch (err) {
      setError(err.message === 'INSUFFICIENT_BALANCE' ? t('send.insufficient') : t('set.soon'));
    } finally {
      setBusy(false);
    }
  };

  const providers = active ? UTILITY_PROVIDERS[active] : [];

  return (
    <>
      <div className="page-head reveal">
        <h1>{t('page.utilities')}</h1>
        <p>{t('util.sub')}</p>
      </div>

      <div className="util-grid">
        {CATEGORIES.map((c) => (
          <button key={c.key} className={`util-card reveal ${active === c.key ? 'active' : ''}`} onClick={() => select(c.key)}>
            <span className="util-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">{c.icon}</svg></span>
            <span className="util-lbl">{t('util.' + c.key)}</span>
          </button>
        ))}
      </div>

      {active && (
        <div className="form-panel-page reveal">
          {receipt ? (
            <div className="util-receipt">
              <div className="util-receipt-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6 9 17l-5-5" /></svg>
              </div>
              <div className="util-receipt-title">{t('util.receiptTitle')}</div>
              <div className="util-receipt-amount">{formatCurrency(receipt.amount)} so'm</div>
              <div className="util-receipt-rows">
                <div className="util-receipt-row"><span>{t('util.receiptProvider')}</span><span>{receipt.provider}</span></div>
                <div className="util-receipt-row"><span>{t('util.receiptAccount')}</span><span>{receipt.account}</span></div>
                <div className="util-receipt-row"><span>{t('util.receiptDate')}</span><span>{receipt.date}</span></div>
              </div>
              <button type="button" className="btn-primary-full" onClick={() => select(active)}>{t('util.receiptAgain')}</button>
            </div>
          ) : (
            <>
              <div className="available-balance">{t('send.available')}: <strong>{formatCurrency(balance)} so'm</strong></div>

              {providers.length > 1 && (
                <div style={{ marginBottom: 20 }}>
                  <div className="util-block-label">{t('util.provider')}</div>
                  <div className="chip-group">
                    {providers.map((p) => (
                      <button key={p} type="button" className={provider === p ? 'active' : ''} onClick={() => setProvider(p)}>{p}</button>
                    ))}
                  </div>
                </div>
              )}

              {recentAccounts.length > 0 && (
                <div>
                  <div className="util-block-label">{t('util.recent')}</div>
                  <div className="util-recent-list">
                    {recentAccounts.map((acc) => (
                      <button key={acc} type="button" className="util-recent-chip" onClick={() => setAccount(acc)}>{acc}</button>
                    ))}
                  </div>
                </div>
              )}

              <form onSubmit={handlePay}>
                <div className="field">
                  <label>{t('util.account')}</label>
                  <input type="text" placeholder={t('util.accountPh')} value={account} onChange={(e) => setAccount(e.target.value)} required />
                </div>
                <div className="field">
                  <label>{t('send.amount')}</label>
                  <div className="amount-input">
                    <input type="text" inputMode="numeric" placeholder="0" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, ''))} required />
                    <span className="cur-suffix">so'm</span>
                  </div>
                </div>
                <div style={{ marginBottom: 20 }}>
                  <div className="util-block-label">{t('util.quickAmount')}</div>
                  <div className="chip-group">
                    {UTILITY_QUICK_AMOUNTS.map((v) => (
                      <button key={v} type="button" className={Number(amount) === v ? 'active' : ''} onClick={() => setAmount(String(v))}>{formatCurrency(v)}</button>
                    ))}
                  </div>
                </div>
                {error && <div className="pw-msg">{error}</div>}
                <button type="submit" className="btn-primary-full" disabled={busy}>{t('util.pay')}</button>
              </form>
            </>
          )}
        </div>
      )}
    </>
  );
}
