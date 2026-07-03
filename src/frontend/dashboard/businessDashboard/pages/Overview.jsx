import { useOutletContext } from 'react-router-dom';
import { useAuth } from '../../../../hooks/useAuth.js';
import { useBusiness } from '../../../../hooks/useBusiness.js';
import { formatCurrency, uzsToUsd } from '../../../../utils/formatCurrency.js';
import RevenueChart from '../RevenueChart.jsx';

const copyIcon = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>;
const linkIcon = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.5 1.5" /><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7L12 19" /></svg>;
const upArrow = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m18 15-6-6-6 6" /></svg>;
const downArrow = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m6 9 6 6 6-6" /></svg>;

// Boshlang'ich (seed) qiymatga nisbatan haqiqiy % o'zgarish — faktura to'langanda oshadi.
function pctChange(current, base) {
  if (!base) return 0;
  return Math.round(((current - base) / base) * 1000) / 10;
}

// Haqiqiy tranzaksiyalar bo'yicha to'lov usullari taqsimoti — karta/hamyon
// ishlatilishiga qarab o'zgaradi, ma'lumot yo'q bo'lsa hammasi 0%.
const CIRC = 2 * Math.PI * 50;
function paymentMethodBreakdown(transactions) {
  const incoming = transactions.filter((tx) => tx.in);
  const total = incoming.length;
  if (!total) return { national: 0, intl: 0, wallet: 0 };
  let nationalCount = 0;
  let intlCount = 0;
  incoming.forEach((tx) => {
    const m = (tx.method || '').toLowerCase();
    if (m.includes('uzcard') || m.includes('humo')) nationalCount += 1;
    else if (m.includes('visa') || m.includes('mastercard') || m.includes('mc')) intlCount += 1;
  });
  const national = Math.round((nationalCount / total) * 100);
  const intl = Math.round((intlCount / total) * 100);
  return { national, intl, wallet: Math.max(0, 100 - national - intl) };
}

export default function Overview() {
  const { t, showToast } = useOutletContext();
  const { user } = useAuth();
  const { revenue, salesCount, avgOrder, baseline, links, customers, transactions, invoices } = useBusiness();
  const fullName = user?.fullName || 'Aziz Karimov';
  const pendingInvoices = invoices.filter((i) => i.status === 'pending').length;
  const revenuePct = pctChange(revenue, baseline.revenue);
  const salesPct = pctChange(salesCount, baseline.salesCount);
  const avgOrderPct = pctChange(avgOrder, baseline.avgOrder);
  const pay = paymentMethodBreakdown(transactions);
  const nationalLen = (pay.national / 100) * CIRC;
  const intlLen = (pay.intl / 100) * CIRC;
  const walletLen = (pay.wallet / 100) * CIRC;

  return (
    <>
      <div className="page-head reveal">
        <div>
          <h1>{fullName}</h1>
          <p>{t('page.sub')}</p>
        </div>
        <div className="head-actions">
          <button className="date-pick"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>{t('page.range')}</button>
        </div>
      </div>

      {/* REVENUE + KPI */}
      <div className="rev-grid">
        <div className="rev-card reveal">
          <div className="lbl"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 16, height: 16 }}><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>{t('rev.label')}</div>
          <div className="amt">{formatCurrency(revenue)} <span className="cur">so'm</span></div>
          <div className="usd">≈ ${uzsToUsd(revenue)} USD</div>
          <div className="foot">
            <span className="chip"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M7 17 17 7m0 0H9m8 0v8" /></svg>{revenuePct >= 0 ? '+' : ''}{revenuePct}%</span>
            <span className="sub">{t('rev.vs')}</span>
          </div>
        </div>
        <div className="kpi reveal">
          <div className="kpi-top"><span className="kpi-ic green"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6 9 17l-5-5" /></svg></span><span className={`kpi-pct ${salesPct >= 0 ? 'up' : 'down'}`}>{salesPct >= 0 ? upArrow : downArrow}{Math.abs(salesPct)}%</span></div>
          <div className="kpi-val">{formatCurrency(salesCount)}</div>
          <div className="kpi-lbl">{t('kpi.sales')}</div>
        </div>
        <div className="kpi reveal">
          <div className="kpi-top"><span className="kpi-ic blue"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3v18h18" /><path d="m19 9-5 5-4-4-3 3" /></svg></span><span className={`kpi-pct ${avgOrderPct >= 0 ? 'up' : 'down'}`}>{avgOrderPct >= 0 ? upArrow : downArrow}{Math.abs(avgOrderPct)}%</span></div>
          <div className="kpi-val">{formatCurrency(avgOrder)}</div>
          <div className="kpi-lbl">{t('kpi.avg')}</div>
        </div>
      </div>

      {/* SMALL KPI ROW */}
      <div className="kpi-row">
        <div className="kpi-sm reveal"><div className="t"><span className="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg></span></div><div className="n">3.4%</div><div className="c">{t('kpi.conv')}</div></div>
        <div className="kpi-sm reveal"><div className="t"><span className="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /></svg></span></div><div className="n">{customers.length}</div><div className="c">{t('kpi.customers')}</div></div>
        <div className="kpi-sm reveal"><div className="t"><span className="ic">{linkIcon}</span></div><div className="n">{links.length}</div><div className="c">{t('kpi.links')}</div></div>
        <div className="kpi-sm reveal"><div className="t"><span className="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" /><path d="M14 2v6h6" /></svg></span></div><div className="n">{pendingInvoices}</div><div className="c">{t('kpi.invoices')}</div></div>
      </div>

      {/* CHART + DONUT */}
      <div className="grid-main">
        <RevenueChart t={t} />
        <div className="panel reveal">
          <div className="panel-head"><div className="panel-title">{t('donut.title')}</div></div>
          <div className="donut-wrap">
            <div className="donut">
              <svg viewBox="0 0 120 120" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                <circle cx="60" cy="60" r="50" fill="none" stroke="var(--bg-elevated)" strokeWidth="14" />
                {nationalLen > 0 && <circle cx="60" cy="60" r="50" fill="none" stroke="#6366F1" strokeWidth="14" strokeDasharray={`${nationalLen} ${CIRC}`} strokeLinecap="round" />}
                {intlLen > 0 && <circle cx="60" cy="60" r="50" fill="none" stroke="#22D3EE" strokeWidth="14" strokeDasharray={`${intlLen} ${CIRC}`} strokeDashoffset={-nationalLen} strokeLinecap="round" />}
                {walletLen > 0 && <circle cx="60" cy="60" r="50" fill="none" stroke="#10B981" strokeWidth="14" strokeDasharray={`${walletLen} ${CIRC}`} strokeDashoffset={-(nationalLen + intlLen)} strokeLinecap="round" />}
              </svg>
              <div className="donut-center"><div className="v">{formatCurrency(salesCount)}</div><div className="l">{t('donut.total')}</div></div>
            </div>
            <div className="donut-legend">
              <div className="row"><span className="sw" style={{ background: '#6366F1' }} /><span className="nm">Uzcard / Humo</span><span className="pc">{pay.national}%</span></div>
              <div className="row"><span className="sw" style={{ background: '#22D3EE' }} /><span className="nm">Visa / MC</span><span className="pc">{pay.intl}%</span></div>
              <div className="row"><span className="sw" style={{ background: '#10B981' }} /><span className="nm">{t('donut.wallet')}</span><span className="pc">{pay.wallet}%</span></div>
            </div>
          </div>
        </div>
      </div>

      {/* PAYMENTS TABLE */}
      <div className="panel reveal" style={{ marginBottom: 16 }}>
        <div className="panel-head">
          <div className="panel-title">{t('pay.title')}</div>
          <span className="panel-link">{t('pay.all')}<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14m-7-7 7 7-7 7" /></svg></span>
        </div>
        <div className="tbl-wrap">
          <table className="tbl">
            <thead><tr><th>{t('th.customer')}</th><th>{t('th.method')}</th><th>{t('th.status')}</th><th>{t('th.date')}</th><th className="right">{t('th.amount')}</th></tr></thead>
            <tbody>
              {transactions.slice(0, 5).map((p) => (
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

      {/* LINKS + TOP CUSTOMERS */}
      <div className="grid-main">
        <div className="panel reveal">
          <div className="panel-head">
            <div className="panel-title">{t('links.title')}</div>
            <span className="panel-link">{t('links.manage')}<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14m-7-7 7 7-7 7" /></svg></span>
          </div>
          <div className="links-grid">
            {links.slice(0, 3).map((l) => (
              <div className="link-card" key={l.id}>
                <div className="link-ic">{linkIcon}</div>
                <div className="link-info"><div className="link-title">{l.title}</div><div className="link-meta">ravon.pay/c/{l.slug} · {l.uses} {t('links.uses')}</div></div>
                <div className="link-amt">{formatCurrency(l.amount)}</div>
                <button className="link-copy" onClick={() => showToast(t('toast.copy'))}>{copyIcon}</button>
              </div>
            ))}
          </div>
        </div>
        <div className="panel reveal">
          <div className="panel-head"><div className="panel-title">{t('top.customers')}</div></div>
          <div className="links-grid">
            {customers.slice(0, 4).map((c) => (
              <div className="link-card" key={c.id} style={{ border: 'none', background: 'transparent', padding: '10px 4px' }}>
                <span className="avatar" style={{ width: 42, height: 42, fontSize: 15, background: `linear-gradient(135deg,${c.grad})` }}>{c.initials}</span>
                <div className="link-info"><div className="link-title">{c.name}</div><div className="link-meta">{c.orders} {t('top.orders')}</div></div>
                <div className="link-amt">{formatCurrency(c.total)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
