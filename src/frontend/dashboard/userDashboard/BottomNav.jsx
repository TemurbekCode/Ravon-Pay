import { NavLink } from 'react-router-dom';
import { ROUTES } from '../../../utils/constants.js';

export default function BottomNav({ onOpenSettings, t }) {
  return (
    <nav className="bottom-nav">
      <NavLink to={ROUTES.dashboard} end className={({ isActive }) => `bn-item ${isActive ? 'active' : ''}`}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="9" rx="1.5" /><rect x="14" y="3" width="7" height="5" rx="1.5" /><rect x="14" y="12" width="7" height="9" rx="1.5" /><rect x="3" y="16" width="7" height="5" rx="1.5" /></svg>
        <span>{t('bn.home')}</span>
      </NavLink>
      <NavLink to={ROUTES.history} className={({ isActive }) => `bn-item ${isActive ? 'active' : ''}`}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3v18h18" /><path d="m7 12 3 3 7-7" /></svg>
        <span>{t('bn.tx')}</span>
      </NavLink>
      <NavLink to={ROUTES.send} className="bn-item center">
        <span className="fab"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="m22 2-7 20-4-9-9-4 20-7Z" /></svg></span>
        <span>{t('bn.send')}</span>
      </NavLink>
      <NavLink to={ROUTES.cards} className={({ isActive }) => `bn-item ${isActive ? 'active' : ''}`}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="5" width="20" height="14" rx="2" /><path d="M2 10h20" /></svg>
        <span>{t('bn.cards')}</span>
      </NavLink>
      <button className="bn-item" onClick={onOpenSettings}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" /></svg>
        <span>{t('bn.more')}</span>
      </button>
    </nav>
  );
}
