import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useWallet } from '../../../hooks/useWallet.js';

export default function Receive() {
  const { t } = useOutletContext();
  const { cards } = useWallet();
  const [copied, setCopied] = useState(false);
  const cardNum = cards[0]?.num?.replace(/•/g, '0') || '8600 1234 5678 9012';

  const copy = () => {
    navigator.clipboard?.writeText(cardNum.replace(/\s/g, ''));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const share = async () => {
    const text = `RavonPay orqali pul yuboring: ${cardNum}`;
    if (navigator.share) {
      try { await navigator.share({ text }); } catch { /* foydalanuvchi bekor qildi */ }
    } else {
      navigator.clipboard?.writeText(text);
    }
  };

  return (
    <>
      <div className="page-head reveal"><h1>{t('page.receive')}</h1></div>
      <div className="qr-box reveal">
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, marginBottom: 6 }}>{t('receive.qr')}</div>
        <div style={{ fontSize: 13.5, color: 'var(--text-muted)', marginBottom: 20 }}>{t('receive.scan')}</div>

        <div className="qr-code">
          {/* Oddiy QR ko'rinish (placeholder pattern) */}
          <svg viewBox="0 0 100 100" fill="#0A0E1A">
            <rect x="0" y="0" width="30" height="30" /><rect x="8" y="8" width="14" height="14" fill="#fff" /><rect x="12" y="12" width="6" height="6" fill="#0A0E1A" />
            <rect x="70" y="0" width="30" height="30" /><rect x="78" y="8" width="14" height="14" fill="#fff" /><rect x="82" y="12" width="6" height="6" fill="#0A0E1A" />
            <rect x="0" y="70" width="30" height="30" /><rect x="8" y="78" width="14" height="14" fill="#fff" /><rect x="12" y="82" width="6" height="6" fill="#0A0E1A" />
            <rect x="40" y="0" width="8" height="8" /><rect x="52" y="0" width="8" height="8" /><rect x="40" y="12" width="8" height="8" /><rect x="60" y="12" width="8" height="8" />
            <rect x="0" y="40" width="8" height="8" /><rect x="16" y="40" width="8" height="8" /><rect x="36" y="36" width="12" height="12" /><rect x="56" y="40" width="8" height="8" /><rect x="72" y="40" width="8" height="8" /><rect x="88" y="40" width="8" height="8" />
            <rect x="40" y="56" width="8" height="8" /><rect x="56" y="56" width="8" height="8" /><rect x="40" y="72" width="8" height="8" /><rect x="60" y="72" width="8" height="8" /><rect x="40" y="88" width="8" height="8" /><rect x="72" y="72" width="12" height="12" /><rect x="88" y="88" width="8" height="8" />
          </svg>
        </div>

        <div className="qr-card-num">
          <span>{cardNum}</span>
          <button className="copy-btn" onClick={copy}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
            {copied ? t('receive.copied') : t('receive.copy')}
          </button>
        </div>

        <div className="qr-actions">
          <button className="qr-action-btn" onClick={share}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4" /></svg>{t('receive.share')}</button>
          <button className="qr-action-btn" onClick={copy}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.5 1.5" /><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7L12 19" /></svg>{t('receive.link')}</button>
        </div>
      </div>
    </>
  );
}
