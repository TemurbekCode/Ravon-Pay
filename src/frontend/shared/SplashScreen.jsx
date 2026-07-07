import { useEffect, useState } from 'react';
import './SplashScreen.scss';

/**
 * RavonPay logotipi animatsiyasi bilan to'liq ekranli yuklanish qoplamasi.
 * Saytga birinchi kirishda (auth holati tiklanayotganda), dashboard
 * ma'lumotlari yuklanayotganda va login/register so'rovlari davomida
 * (Render'ning "cold start"i bir necha o'n soniya cho'zilishi mumkin)
 * ishlatiladi.
 */
const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export default function SplashScreen({ label }) {
  const [phase, setPhase] = useState(() => (prefersReducedMotion() ? 4 : 0));

  useEffect(() => {
    if (prefersReducedMotion()) return undefined;

    const timers = [
      setTimeout(() => setPhase(1), 50),
      setTimeout(() => setPhase(2), 350),
      setTimeout(() => setPhase(3), 750),
      setTimeout(() => setPhase(4), 1200),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  const cls = ['splash'];
  if (phase >= 1) cls.push('phase-1');
  if (phase >= 2) cls.push('phase-2');
  if (phase >= 3) cls.push('phase-3');
  if (phase >= 4) cls.push('phase-4', 'looping');

  return (
    <div className="splash-screen">
      <svg className="bg-waves" viewBox="0 0 1600 300" preserveAspectRatio="none" aria-hidden="true">
        <g className="flow-a">
          <path className="wave" d="M -160 150 Q -120 110 -80 150 T 0 150 T 80 150 T 160 150 T 240 150 T 320 150 T 400 150 T 480 150 T 560 150 T 640 150 T 720 150 T 800 150 T 880 150 T 960 150 T 1040 150 T 1120 150 T 1200 150 T 1280 150 T 1360 150 T 1440 150 T 1520 150 T 1600 150 T 1680 150 T 1760 150" />
        </g>
        <g className="flow-b">
          <path className="wave" style={{ opacity: 0.3 }} d="M -160 200 Q -120 165 -80 200 T 0 200 T 80 200 T 160 200 T 240 200 T 320 200 T 400 200 T 480 200 T 560 200 T 640 200 T 720 200 T 800 200 T 880 200 T 960 200 T 1040 200 T 1120 200 T 1200 200 T 1280 200 T 1360 200 T 1440 200 T 1520 200 T 1600 200 T 1680 200 T 1760 200" />
        </g>
      </svg>

      <main className={cls.join(' ')}>
        <div className="logo-wrap">
          <div className="logo-glow" />
          <svg viewBox="0 0 240 240" role="img" aria-label="RavonPay logotipi">
            <defs>
              <clipPath id="splashSquareClip">
                <rect x="6" y="6" width="228" height="228" rx="66" />
              </clipPath>
              <linearGradient id="splashSqGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#1B1BFF" />
                <stop offset="100%" stopColor="#0808B8" />
              </linearGradient>
              <path id="splashFlightPath" d="M -30 152 Q 6 122 42 152 T 114 152 T 186 152 T 258 152 T 330 152" />
            </defs>

            <rect x="6" y="6" width="228" height="228" rx="66" fill="url(#splashSqGrad)" />

            <g clipPath="url(#splashSquareClip)">
              <g className="wave-flow-back">
                <path className="wave wave-back" d="M -80 168 Q -44 140 -8 168 T 64 168 T 136 168 T 208 168 T 280 168 T 352 168" />
              </g>
              <g className="wave-flow-front">
                <path className="wave wave-front" d="M -80 150 Q -44 118 -8 150 T 64 150 T 136 150 T 208 150 T 280 150 T 352 150" />
              </g>
            </g>

            <text className="letter-r" x="118" y="168" textAnchor="middle">R</text>

            <g clipPath="url(#splashSquareClip)">
              <g className="arrow">
                <path d="M 0 -11 L 22 0 L 0 11 L 6 0 Z" fill="#fff">
                  <animateMotion dur="2.4s" repeatCount="indefinite" rotate="auto">
                    <mpath href="#splashFlightPath" />
                  </animateMotion>
                </path>
              </g>
            </g>
          </svg>
        </div>

        <div className="wordmark" aria-label="RavonPay">
          {'Ravon'.split('').map((ch, i) => <span key={`r${i}`} style={{ '--i': i }}>{ch}</span>)}
          {'Pay'.split('').map((ch, i) => <span key={`p${i}`} className="pay" style={{ '--i': i + 5 }}>{ch}</span>)}
        </div>

        <div className="progress" role="status">
          <div className="bar"><div className="bar-fill" /></div>
          <div className="status"><span>{label || 'Yuklanmoqda...'}</span></div>
        </div>
      </main>
    </div>
  );
}
