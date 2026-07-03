import { NavLink } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth.js';
import { getInitials } from '../../../utils/formatCurrency.js';
import { ROUTES } from '../../../utils/constants.js';

// Navigatsiya elementlari (HTML'dagi tartibda)
const MAIN_NAV = [
  { to: ROUTES.dashboard, key: 'nav.dashboard', end: true, icon: (
    <><rect x="3" y="3" width="7" height="9" rx="1.5" /><rect x="14" y="3" width="7" height="5" rx="1.5" /><rect x="14" y="12" width="7" height="9" rx="1.5" /><rect x="3" y="16" width="7" height="5" rx="1.5" /></>
  ) },
  { to: ROUTES.wallet, key: 'nav.wallet', icon: <><path d="M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z" /><path d="M16 12h.01M3 9h18" /></> },
  { to: ROUTES.send, key: 'nav.send', icon: <><path d="m22 2-7 20-4-9-9-4 20-7Z" /><path d="M22 2 11 13" /></> },
  { to: ROUTES.receive, key: 'nav.receive', icon: <path d="M12 5v14m-7-7 7 7 7-7" /> },
  { to: ROUTES.history, key: 'nav.tx', icon: <><path d="M3 3v18h18" /><path d="m7 12 3 3 7-7" /></> },
  { to: ROUTES.cards, key: 'nav.cards', icon: <><rect x="2" y="5" width="20" height="14" rx="2" /><path d="M2 10h20" /></> },
  { to: ROUTES.exchange, key: 'nav.exchange', icon: <><path d="M7 16V4m0 0L3 8m4-4 4 4" /><path d="M17 8v12m0 0 4-4m-4 4-4-4" /></> },
  { to: ROUTES.utilities, key: 'nav.utilities', icon: <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8Z" /> },
];

export default function Sidebar({ open, onClose, onOpenSettings, t }) {
  const { user } = useAuth();
  const name = user?.fullName || 'Aziz Karimov';
  const email = user?.email || 'aziz@email.com';

  return (
    <aside className={`sidebar ${open ? 'open' : ''}`}>
      <div className="sidebar-logo">
        <span className="mark">
          <img src="/RavonPayLogoBr.png" alt="RavonPay" />
        </span>
        Ravon<span className="gradient-text">Pay</span>
      </div>

      {/* Mobil qidiruv */}
      <div className="sidebar-search">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
        <input type="text" placeholder={t('top.search')} />
      </div>

      <nav className="nav-group">
        {MAIN_NAV.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.end} onClick={onClose}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">{item.icon}</svg>
            <span>{t(item.key)}</span>
          </NavLink>
        ))}
      </nav>

      <div className="nav-label">{t('nav.other')}</div>
      <nav className="nav-group">
        <button className="nav-item" onClick={() => { onOpenSettings(); onClose(); }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" /></svg>
          <span>{t('nav.settings')}</span>
        </button>
      </nav>

      <div className="sidebar-foot">
        <NavLink to={ROUTES.profile} onClick={onClose} className="user-chip">
          <div className="avatar">{getInitials(name)}</div>
          <div className="user-chip-info">
            <div className="user-chip-name">{name}</div>
            <div className="user-chip-mail">{email}</div>
          </div>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 16, height: 16, color: 'var(--text-muted)' }}><path d="m6 9 6 6 6-6" /></svg>
        </NavLink>
      </div>
    </aside>
  );
}
