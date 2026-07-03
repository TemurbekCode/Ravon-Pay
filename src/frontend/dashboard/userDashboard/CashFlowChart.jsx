import { useEffect, useRef, useState } from 'react';
import { useWallet } from '../../../hooks/useWallet.js';
import { buildIncomeExpenseSeries } from '../../../utils/chartSeries.js';

// Pul oqimi grafigi (SVG) — haqiqiy tranzaksiyalar asosida quriladi.
// Hisobda tranzaksiya bo'lmasa, chiziq 0 da tekis turadi.
export default function CashFlowChart({ t }) {
  const { transactions } = useWallet();
  const [range, setRange] = useState(30);
  const svgRef = useRef(null);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const d = buildIncomeExpenseSeries(transactions, range);
    const W = 600, H = 240, pad = 10;
    const n = d.income.length;
    const max = Math.max(...d.income, ...d.expense, 1) * 1.15;
    const gridColor = getComputedStyle(document.documentElement).getPropertyValue('--border').trim();

    const x = (i) => pad + (i * (W - pad * 2)) / (n - 1);
    const y = (v) => H - pad - (v / max) * (H - pad * 2);
    const line = (arr) => arr.map((v, i) => (i === 0 ? 'M' : 'L') + ' ' + x(i).toFixed(1) + ' ' + y(v).toFixed(1)).join(' ');
    const area = (arr) => line(arr) + ' L ' + x(n - 1).toFixed(1) + ' ' + (H - pad) + ' L ' + pad + ' ' + (H - pad) + ' Z';

    let grid = '';
    for (let g = 0; g <= 3; g++) {
      const gy = pad + (g * (H - pad * 2)) / 3;
      grid += `<line x1="${pad}" y1="${gy}" x2="${W - pad}" y2="${gy}" stroke="${gridColor}" stroke-width="1"/>`;
    }

    svg.innerHTML =
      '<defs>' +
      '<linearGradient id="gIncome" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#10B981" stop-opacity="0.28"/><stop offset="100%" stop-color="#10B981" stop-opacity="0"/></linearGradient>' +
      '<linearGradient id="gExpense" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#6366F1" stop-opacity="0.22"/><stop offset="100%" stop-color="#6366F1" stop-opacity="0"/></linearGradient>' +
      '</defs>' + grid +
      `<path d="${area(d.expense)}" fill="url(#gExpense)"/>` +
      `<path d="${area(d.income)}" fill="url(#gIncome)"/>` +
      `<path d="${line(d.expense)}" fill="none" stroke="#6366F1" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>` +
      `<path d="${line(d.income)}" fill="none" stroke="#10B981" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>` +
      `<circle cx="${x(n - 1)}" cy="${y(d.income[n - 1])}" r="4.5" fill="#10B981" stroke="var(--bg-card)" stroke-width="2"/>` +
      `<circle cx="${x(n - 1)}" cy="${y(d.expense[n - 1])}" r="4.5" fill="#6366F1" stroke="var(--bg-card)" stroke-width="2"/>`;

    svg.querySelectorAll('path[stroke]').forEach((p) => {
      const len = p.getTotalLength();
      p.style.strokeDasharray = len;
      p.style.strokeDashoffset = len;
      p.animate([{ strokeDashoffset: len }, { strokeDashoffset: 0 }], { duration: 900, easing: 'cubic-bezier(0.16,1,0.3,1)', fill: 'forwards' });
    });
  }, [range, transactions]);

  return (
    <div className="panel reveal">
      <div className="panel-head">
        <div>
          <div className="panel-title">{t('chart.title')}</div>
          <div className="panel-sub">{t('chart.sub')}</div>
        </div>
        <div className="chip-group">
          <button className={range === 7 ? 'active' : ''} onClick={() => setRange(7)}>{t('chart.7d')}</button>
          <button className={range === 30 ? 'active' : ''} onClick={() => setRange(30)}>{t('chart.30d')}</button>
          <button className={range === 12 ? 'active' : ''} onClick={() => setRange(12)}>{t('chart.12m')}</button>
        </div>
      </div>
      <div className="chart-wrap">
        <svg ref={svgRef} viewBox="0 0 600 240" preserveAspectRatio="none" style={{ width: '100%', height: '100%', overflow: 'visible' }} />
      </div>
      <div className="chart-legend">
        <div className="item"><span className="swatch" style={{ background: '#10B981' }} />{t('chart.income')}</div>
        <div className="item"><span className="swatch" style={{ background: '#6366F1' }} />{t('chart.expense')}</div>
      </div>
    </div>
  );
}
