import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useWallet } from '../../../hooks/useWallet.js';
import { formatCurrency } from '../../../utils/formatCurrency.js';

const ICONS = {
  in: <path d="M12 19V5m-7 7 7-7 7 7" />,
  out: <path d="m22 2-7 20-4-9-9-4 20-7Z" />,
  card: <><rect x="2" y="5" width="20" height="14" rx="2" /><path d="M2 10h20" /></>,
};

export default function History() {
  const { t } = useOutletContext();
  const { transactions } = useWallet();
  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('');

  const filtered = transactions.filter((tx) => {
    const matchFilter = filter === 'all' || (filter === 'in' && tx.type === 'in') || (filter === 'out' && tx.type !== 'in');
    const matchQuery = tx.name.toLowerCase().includes(query.toLowerCase());
    return matchFilter && matchQuery;
  });

  return (
    <>
      <div className="page-head reveal"><h1>{t('page.tx')}</h1></div>

      <div className="form-panel-page reveal" style={{ maxWidth: '100%', padding: 0, background: 'none', border: 'none' }}>
        <div className="field" style={{ maxWidth: 400 }}>
          <input type="text" placeholder={t('tx.search')} value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
      </div>

      <div className="tx-filters reveal">
        {['all', 'in', 'out'].map((f) => (
          <button key={f} className={`tx-filter-btn ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
            {t('tx.filter.' + f)}
          </button>
        ))}
      </div>

      <div className="panel reveal">
        <div className="tx-list">
          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>{t('tx.empty')}</div>
          ) : filtered.map((tx) => (
            <div className="tx-row" key={tx.id}>
              <div className={`tx-icon ${tx.type}`}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">{ICONS[tx.type]}</svg></div>
              <div className="tx-info">
                <div className="tx-name">{tx.name}</div>
                <div className="tx-meta"><span className="tx-date">{tx.date}</span><span className={`tx-status ${tx.status}`}>{t('tx.' + tx.status)}</span></div>
              </div>
              <div className={`tx-amount ${tx.amount > 0 ? 'in' : ''}`}>{tx.amount > 0 ? '+' : ''}{formatCurrency(tx.amount)}</div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
