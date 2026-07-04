import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth.js';
import { useWallet } from '../../../hooks/useWallet.js';
import { getInitials } from '../../../utils/formatCurrency.js';
import { ROUTES } from '../../../utils/constants.js';
import AddBusinessProfileModal from './AddBusinessProfileModal.jsx';
import NotificationsPanel from './NotificationsPanel.jsx';

export default function Topbar({ onMenu, onOpenSettings, t }) {
  const { user, logout, profiles, switchAccount } = useAuth();
  const { notifications, markNotificationsRead } = useWallet();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [addProfileOpen, setAddProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const menuRef = useRef(null);
  const unreadCount = notifications.filter((n) => !n.read).length;

  const name = user?.fullName || 'Foydalanuvchi';
  const contact = user?.phone || '';

  useEffect(() => {
    const close = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false); };
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, []);

  const handleLogout = () => { logout(); navigate('/login'); };

  // Biznes profili allaqachon mavjud bo'lsa -> shunchaki almashtiradi (qayta ro'yxatdan
  // o'tkazmasdan). Bo'lmasa -> yengil "biznes profil qo'shish" oynasini ochadi.
  const handleBusinessProfile = async () => {
    setMenuOpen(false);
    if (profiles.includes('business')) {
      await switchAccount('business');
      navigate('/business');
    } else {
      setAddProfileOpen(true);
    }
  };

  return (
    <>
      <header className="topbar">
        <button className="icon-btn menu-toggle" onClick={onMenu} aria-label="Menu">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12h18M3 6h18M3 18h18" /></svg>
        </button>
        <div className="topbar-title">{t('top.title')}</div>

        <div className="topbar-actions">
          <button className="icon-btn" aria-label="Notifications" onClick={() => setNotifOpen(true)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.7 21a2 2 0 0 1-3.4 0" /></svg>
            {unreadCount > 0 && <span className="notif-badge">{unreadCount}</span>}
          </button>

          <div className={`profile-menu ${menuOpen ? 'open' : ''}`} ref={menuRef}>
            <button className="profile-btn" onClick={(e) => { e.stopPropagation(); setMenuOpen((o) => !o); }}>
              <span className="avatar">{getInitials(name)}</span>
              <span className="profile-btn-info">
                <span className="pn">{name}</span>
                <span className="pm">{contact}</span>
              </span>
              <svg className="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m6 9 6 6 6-6" /></svg>
            </button>
            <div className="profile-dropdown">
              <div className="pd-head">
                <span className="avatar" style={{ width: 46, height: 46, fontSize: 17 }}>{getInitials(name)}</span>
                <div><div className="pd-name">{name}</div><div className="pd-mail">{contact}</div></div>
              </div>
              <button className="pd-item" onClick={() => { navigate(ROUTES.profile); setMenuOpen(false); }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                <span>{t('pd.profile')}</span>
              </button>
              <button className="pd-item" onClick={handleBusinessProfile}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 21h18M5 21V7l8-4v18M19 21V11l-6-4" /><path d="M9 9v.01M9 12v.01M9 15v.01M9 18v.01" /></svg>
                <span>{t('pd.business')}</span>
              </button>
              <button className="pd-item" onClick={() => { onOpenSettings(); setMenuOpen(false); }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" /></svg>
                <span>{t('pd.settings')}</span>
              </button>
              <div className="pd-divider" />
              <button className="pd-item danger" onClick={handleLogout}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" /></svg>
                <span>{t('pd.logout')}</span>
              </button>
            </div>
          </div>
        </div>
      </header>
      <AddBusinessProfileModal show={addProfileOpen} onClose={() => setAddProfileOpen(false)} t={t} />
      <NotificationsPanel show={notifOpen} onClose={() => setNotifOpen(false)} notifications={notifications} onMarkAllRead={markNotificationsRead} t={t} />
    </>
  );
}
