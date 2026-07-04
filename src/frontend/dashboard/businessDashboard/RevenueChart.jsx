import { useEffect, useRef } from 'react';
import { useBusiness } from '../../../hooks/useBusiness.js';
import { buildRevenueSeries } from '../../../utils/chartSeries.js';

// Daromad dinamikasi grafigi — haqiqiy tranzaksiyalar asosida quriladi.
// Hisobda savdo bo'lmasa, chiziq 0 da tekis turadi. `range`/`onRangeChange`
// sahifa darajasidagi (Overview) davr tanlagichi bilan bir xil holatni
// baham ko'radi — shu orqali tepadagi "So'nggi 30 kun" tugmasi ham shu
// grafikni real o'zgartiradi.
export default function RevenueChart({ t, range, onRangeChange }) {
  const { transactions } = useBusiness();
  const svgRef = useRef(null);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const d = buildRevenueSeries(transactions, range);
    const W = 600, H = 260, pad = 10;
    const n = d.length;
    const rawMax = Math.max(...d);
    const max = rawMax === 0 ? 1 : rawMax * 1.15;
    const min = rawMax === 0 ? 0 : Math.min(...d) * 0.7;
    const x = (i) => pad + (i * (W - pad * 2)) / (n - 1);
    const y = (v) => H - pad - ((v - min) / (max - min)) * (H - pad * 2);
    const line = (arr) => arr.map((v, i) => (i === 0 ? 'M' : 'L') + ' ' + x(i).toFixed(1) + ' ' + y(v).toFixed(1)).join(' ');
    const area = (arr) => line(arr) + ' L ' + x(n - 1).toFixed(1) + ' ' + (H - pad) + ' L ' + pad + ' ' + (H - pad) + ' Z';
    const grid = getComputedStyle(document.documentElement).getPropertyValue('--border').trim();

    let g = '';
    for (let i = 0; i <= 3; i++) { const gy = pad + (i * (H - pad * 2)) / 3; g += `<line x1="${pad}" y1="${gy}" x2="${W - pad}" y2="${gy}" stroke="${grid}" stroke-width="1"/>`; }

    svg.innerHTML =
      '<defs><linearGradient id="gRev" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#6366F1" stop-opacity="0.35"/><stop offset="100%" stop-color="#6366F1" stop-opacity="0"/></linearGradient></defs>' +
      g +
      `<path d="${area(d)}" fill="url(#gRev)"/>` +
      `<path d="${line(d)}" fill="none" stroke="#6366F1" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/>` +
      `<circle cx="${x(n - 1)}" cy="${y(d[n - 1])}" r="5" fill="#6366F1" stroke="var(--bg-card)" stroke-width="2.5"/>`;

    svg.querySelectorAll('path[stroke]').forEach((p) => {
      const len = p.getTotalLength();
      p.style.strokeDasharray = len; p.style.strokeDashoffset = len;
      p.animate([{ strokeDashoffset: len }, { strokeDashoffset: 0 }], { duration: 1000, easing: 'cubic-bezier(0.16,1,0.3,1)', fill: 'forwards' });
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
          <button className={range === 7 ? 'active' : ''} onClick={() => onRangeChange(7)}>{t('chart.7d')}</button>
          <button className={range === 30 ? 'active' : ''} onClick={() => onRangeChange(30)}>{t('chart.30d')}</button>
          <button className={range === 12 ? 'active' : ''} onClick={() => onRangeChange(12)}>{t('chart.12m')}</button>
        </div>
      </div>
      <div className="chart-wrap">
        <svg ref={svgRef} viewBox="0 0 600 260" preserveAspectRatio="none" style={{ width: '100%', height: '100%', overflow: 'visible' }} />
      </div>
      <div className="chart-legend">
        <div className="item"><span className="swatch" style={{ background: '#6366F1' }} />{t('chart.revenue')}</div>
      </div>
    </div>
  );
}
