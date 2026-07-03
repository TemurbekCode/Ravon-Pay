import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useBusiness } from '../../../../hooks/useBusiness.js';
import { formatCurrency } from '../../../../utils/formatCurrency.js';

export default function Transactions() {
  const { t } = useOutletContext();
  const { transactions } = useBusiness();
  const [filter, setFilter] = useState('all');

  const rows = transactions.filter((r) => filter === 'all' || r.status === filter);

  return (
    <>
      <div className="page-head reveal"><h1>{t('page.tx')}</h1></div>

      <div className="head-actions reveal" style={{ marginBottom: 18 }}>
        {['all', 'done', 'pending', 'failed'].map((f) => (
          <button key={f} className="date-pick" style={filter === f ? { borderColor: 'var(--brand)', color: 'var(--text-primary)' } : {}} onClick={() => setFilter(f)}>
            {f === 'all' ? t('pay.all') : t('st.' + f)}
          </button>
        ))}
      </div>

      <div className="panel reveal">
        <div className="tbl-wrap">
          <table className="tbl">
            <thead><tr><th>{t('th.customer')}</th><th>{t('th.method')}</th><th>{t('th.status')}</th><th>{t('th.date')}</th><th className="right">{t('th.amount')}</th></tr></thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p.id}>
                  <td><div className="cust"><span className="avatar" style={{ background: `linear-gradient(135deg,${p.grad})` }}>{p.initials}</span><div><div className="nm">{p.name}</div><div className="em">{p.email}</div></div></div></td>
                  <td><span className="method"><span className="mi">{p.mi}</span>{p.method}</span></td>
                  <td><span className={`pill ${p.status}`}>{t('st.' + p.status)}</span></td>
                  <td>{p.date}</td>
                  <td className={`right amt ${p.in ? 'in' : ''}`}>{p.in ? '+' : ''}{formatCurrency(p.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
