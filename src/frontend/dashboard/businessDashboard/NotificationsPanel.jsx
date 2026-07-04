import { useState } from 'react';

const ICONS = {
  in: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 19V5m-7 7 7-7 7 7" /></svg>,
  out: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14m7-7-7 7-7-7" /></svg>,
  system: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.7 21a2 2 0 0 1-3.4 0" /></svg>,
  bizinfo: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 21h18M6 21V8l6-4 6 4v13M10 21v-6h4v6" /></svg>,
};

// Bildirishnomalar paneli — pul yechilsa/tushsa yoki RavonPay yangilik chiqarsa,
// shu yerda ko'rinadi. Ochilganda barchasi o'qilgan deb belgilanadi. "bizinfo"
// turidagi bildirishnoma bosilsa, Sozlamalar bo'limiga o'tkazadi (STIR/manzil
// qo'shish uchun) — boshqa turlar hozircha faqat ma'lumot ko'rsatadi.
export default function NotificationsPanel({ show, onClose, notifications, onMarkAllRead, onOpenSettings, t }) {
  const [prevShow, setPrevShow] = useState(show);

  if (show !== prevShow) {
    setPrevShow(show);
    if (show) onMarkAllRead?.();
  }

  const handleClick = (n) => {
    if (n.kind === 'bizinfo' && onOpenSettings) {
      onOpenSettings();
      onClose();
    }
  };

  return (
    <div className={`modal-overlay ${show ? 'show' : ''}`} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal notif-modal">
        <div className="modal-head">
          <h3>{t('notif.title')}</h3>
          <button className="modal-close" onClick={onClose}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12" /></svg></button>
        </div>
        {notifications.length === 0 ? (
          <p className="notif-empty">{t('notif.empty')}</p>
        ) : (
          <div className="notif-list">
            {notifications.map((n) => (
              <div
                className={`notif-item ${n.read ? '' : 'unread'} ${n.kind === 'bizinfo' ? 'clickable' : ''}`}
                key={n.id}
                onClick={() => handleClick(n)}
              >
                <span className={`notif-ic ${n.kind}`}>{ICONS[n.kind] || ICONS.system}</span>
                <div className="notif-body">
                  <div className="notif-title">{n.title}</div>
                  <div className="notif-msg">{n.body}</div>
                  <div className="notif-date">{n.date}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
