import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useBusiness } from '../../../../hooks/useBusiness.js';
import { formatCurrency } from '../../../../utils/formatCurrency.js';

export default function Customers() {
  const { t } = useOutletContext();
  const { customers } = useBusiness();
  const [q, setQ] = useState('');
  const rows = customers.filter((c) => c.name.toLowerCase().includes(q.toLowerCase()));

  return (
    <>
      <div className="page-head reveal"><div><h1>{t('page.customers')}</h1></div></div>
      <div className="search-field reveal">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
        <input type="text" placeholder={t('customers.search')} value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <div className="panel reveal">
        <div className="tbl-wrap">
          <table className="tbl">
            <thead><tr><th>{t('th.customer')}</th><th>{t('customers.orders')}</th><th className="right">{t('customers.total')}</th></tr></thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.id}>
                  <td><div className="cust"><span className="avatar" style={{ background: `linear-gradient(135deg,${c.grad})` }}>{c.initials}</span><div><div className="nm">{c.name}</div><div className="em">{c.email}</div></div></div></td>
                  <td>{c.orders}</td>
                  <td className="right amt">{formatCurrency(c.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
