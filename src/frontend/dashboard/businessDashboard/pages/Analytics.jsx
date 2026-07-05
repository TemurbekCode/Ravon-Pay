import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useBusiness } from '../../../../hooks/useBusiness.js';
import { formatCurrency } from '../../../../utils/formatCurrency.js';
import { pctChange, invoiceConversionRate } from '../../../../utils/percentChange.js';
import RevenueChart from '../RevenueChart.jsx';

export default function Analytics() {
  const { t } = useOutletContext();
  const { revenue, salesCount, avgOrder, baseline, invoices } = useBusiness();
  const [range, setRange] = useState(30);
  const revenuePct = pctChange(revenue, baseline.revenue);
  const salesPct = pctChange(salesCount, baseline.salesCount);
  const avgOrderPct = pctChange(avgOrder, baseline.avgOrder);
  const convRate = invoiceConversionRate(invoices);
  return (
    <>
      <div className="page-head reveal"><h1>{t('page.analytics')}</h1></div>
      <div className="kpi-row">
        <div className="kpi-sm reveal"><div className="t"><span className="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg></span><span className={`kpi-pct ${revenuePct >= 0 ? 'up' : 'down'}`}>{revenuePct >= 0 ? '+' : ''}{revenuePct}%</span></div><div className="n">{formatCurrency(revenue)}</div><div className="c">{t('analytics.revenue')}</div></div>
        <div className="kpi-sm reveal"><div className="t"><span className="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6" /></svg></span><span className={`kpi-pct ${salesPct >= 0 ? 'up' : 'down'}`}>{salesPct >= 0 ? '+' : ''}{salesPct}%</span></div><div className="n">{formatCurrency(salesCount)}</div><div className="c">{t('analytics.orders')}</div></div>
        <div className="kpi-sm reveal"><div className="t"><span className="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3v18h18" /><path d="m19 9-5 5-4-4-3 3" /></svg></span><span className={`kpi-pct ${avgOrderPct >= 0 ? 'up' : 'down'}`}>{avgOrderPct >= 0 ? '+' : ''}{avgOrderPct}%</span></div><div className="n">{formatCurrency(avgOrder)}</div><div className="c">{t('analytics.aov')}</div></div>
        <div className="kpi-sm reveal"><div className="t"><span className="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg></span></div><div className="n">{convRate}%</div><div className="c">{t('kpi.conv')}</div></div>
      </div>
      <RevenueChart t={t} range={range} onRangeChange={setRange} />
    </>
  );
}
