import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useBusiness } from '../../../../hooks/useBusiness.js';

const CATEGORIES = [
  { key: 'electricity', icon: <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8Z" /> },
  { key: 'gas', icon: <path d="M8.5 14.5A2.5 2.5 0 0 0 11 17a2.5 2.5 0 0 0 2.5-2.5c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7.5 7.5 0 1 1-15 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5Z" /> },
  { key: 'water', icon: <path d="M12 2.69s5.5 5.68 5.5 10.36a5.5 5.5 0 1 1-11 0C6.5 8.37 12 2.69 12 2.69Z" /> },
  { key: 'internet', icon: <><path d="M5 12.55a11 11 0 0 1 14.08 0" /><path d="M1.42 9a16 16 0 0 1 21.16 0" /><path d="M8.53 16.11a6 6 0 0 1 6.95 0" /><circle cx="12" cy="20" r="1" /></> },
];

export default function Utilities() {
  const { t, showToast } = useOutletContext();
  const { withdraw } = useBusiness();
  const [active, setActive] = useState(null);
  const [account, setAccount] = useState('');
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const select = (key) => { setActive(key); setAccount(''); setAmount(''); setError(''); };

  const handlePay = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await withdraw(Number(amount));
      showToast(t('toast.new'));
      setActive(null);
    } catch (err) {
      setError(err.message === 'INSUFFICIENT_BALANCE' ? t('send.insufficient') : t('set.soon'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="page-head reveal"><div><h1>{t('page.utilities')}</h1></div></div>

      <div className="panel reveal">
        <div className="links-grid">
          {CATEGORIES.map((c) => (
            <div key={c.key} className={`link-card util-link-card ${active === c.key ? 'active' : ''}`} onClick={() => select(c.key)} style={{ cursor: 'pointer' }}>
              <div className="link-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">{c.icon}</svg></div>
              <div className="link-info"><div className="link-title">{t('util.' + c.key)}</div></div>
            </div>
          ))}
        </div>
      </div>

      {active && (
        <div className="panel reveal">
          <div className="panel-head"><div className="panel-title">{t('util.' + active)}</div></div>
          <form onSubmit={handlePay} style={{ maxWidth: 420 }}>
            <div className="biz-field">
              <label>{t('util.account')}</label>
              <input type="text" placeholder={t('util.accountPh')} value={account} onChange={(e) => setAccount(e.target.value)} required />
            </div>
            <div className="biz-field">
              <label>{t('send.amount')}</label>
              <input type="text" inputMode="numeric" placeholder="0" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, ''))} required />
            </div>
            {error && <div className="pw-msg">{error}</div>}
            <button type="submit" className="btn-new" style={{ width: '100%', justifyContent: 'center' }} disabled={busy}>{t('util.pay')}</button>
          </form>
        </div>
      )}
    </>
  );
}
