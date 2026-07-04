// Qo'llab-quvvatlash oynasi — Telegram kanal va yordamchi bot havolalari.
// Sozlamalar bo'limidagi "Qo'llab-quvvatlash xizmati" tugmasi ochadi.
export default function SupportModal({ show, onClose, t }) {
  return (
    <div className={`modal-overlay ${show ? 'show' : ''}`} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal">
        <div className="modal-head">
          <h3>{t('support.modalTitle')}</h3>
          <button className="modal-close" onClick={onClose}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12" /></svg></button>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: 13.5, marginTop: -8, marginBottom: 20 }}>{t('support.sub')}</p>
        <div className="support-list">
          <a className="support-item" href="https://t.me/ravonpay_uz" target="_blank" rel="noreferrer">
            <span className="support-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5H5l2.5-3A8.5 8.5 0 1 1 21 11.5Z" /></svg></span>
            <div className="support-info">
              <div className="support-name">{t('support.channel')}</div>
              <div className="support-desc">{t('support.channelDesc')}</div>
              <div className="support-handle">@ravonpay_uz</div>
            </div>
            <svg className="support-go" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M7 17 17 7M7 7h10v10" /></svg>
          </a>
          <a className="support-item" href="https://t.me/ravonpayHelpBot" target="_blank" rel="noreferrer">
            <span className="support-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="8" width="18" height="12" rx="2" /><path d="M12 8V4m-3 0h6" /><circle cx="9" cy="14" r="1" /><circle cx="15" cy="14" r="1" /></svg></span>
            <div className="support-info">
              <div className="support-name">{t('support.bot')}</div>
              <div className="support-desc">{t('support.botDesc')}</div>
              <div className="support-handle">@ravonpayHelpBot</div>
            </div>
            <svg className="support-go" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M7 17 17 7M7 7h10v10" /></svg>
          </a>
        </div>
      </div>
    </div>
  );
}
