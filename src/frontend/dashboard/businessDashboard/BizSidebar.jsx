import { NavLink } from 'react-router-dom';
import { BIZ_ROUTES } from './business.routes.js';
import { useBusiness } from '../../../hooks/useBusiness.js';
import { useAuth } from '../../../hooks/useAuth.js';

const SVG = {
  overview: <><rect x="3" y="3" width="7" height="9" rx="1.5" /><rect x="14" y="3" width="7" height="5" rx="1.5" /><rect x="14" y="12" width="7" height="9" rx="1.5" /><rect x="3" y="16" width="7" height="5" rx="1.5" /></>,
  balance: <><path d="M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z" /><path d="M16 12h.01M3 9h18" /></>,
  tx: <><path d="M3 3v18h18" /><path d="m7 12 3 3 7-7" /></>,
  links: <><path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.5 1.5" /><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7L12 19" /></>,
  invoices: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" /><path d="M14 2v6h6M9 13h6M9 17h6" /></>,
  checkout: <><circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6" /></>,
  customers: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></>,
  analytics: <><path d="M3 3v18h18" /><rect x="7" y="10" width="3" height="7" /><rect x="12" y="6" width="3" height="11" /><rect x="17" y="13" width="3" height="4" /></>,
  team: <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></>,
  exchange: <><path d="M7 16V4m0 0L3 8m4-4 4 4" /><path d="M17 8v12m0 0 4-4m-4 4-4-4" /></>,
  utilities: <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8Z" />,
  settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" /></>,
};

function Item({ to, end, icon, label, badge, badgeNew, onClose }) {
  return (
    <NavLink to={to} end={end} onClick={onClose} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">{SVG[icon]}</svg>
      <span>{label}</span>
      {(badge || badge === 0) && <span className={`badge ${badgeNew ? 'new' : ''}`}>{badge}</span>}
    </NavLink>
  );
}

export default function BizSidebar({ open, onClose, onOpenSettings, onOpenUpgrade, t }) {
  const { links, team, subscription } = useBusiness();
  const { user } = useAuth();

  const companyName = user?.companyName || user?.fullName || t('biz.plan');
  const companyInitials = companyName.split(' ').map((p) => p[0]).filter(Boolean).slice(0, 2).join('').toUpperCase() || 'B';

  return (
    <aside className={`sidebar ${open ? 'open' : ''}`}>
      <div className="sidebar-logo">
        <span className="mark"><img src="/RavonPayLogoBr.png" alt="RavonPay" /></span>
        Ravon<span className="gradient-text">Pay</span>
        <span className="biz-tag">BUSINESS</span>
      </div>

      <div className="sidebar-search">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
        <input type="text" placeholder={t('top.search')} />
      </div>

      <div className="biz-switch" onClick={onOpenUpgrade}>
        <div className="biz-logo">{companyInitials}</div>
        <div className="biz-info"><div className="biz-name">{companyName}</div><div className="biz-plan">{subscription.founder ? t('biz.plan') : (subscription.plan === 'yearly' ? t('sub.yearly') : t('sub.monthly'))}</div></div>
        <svg className="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6" /></svg>
      </div>

      <nav className="nav-group">
        <Item to={BIZ_ROUTES.overview} end icon="overview" label={t('nav.overview')} onClose={onClose} />
        <Item to={BIZ_ROUTES.balance} icon="balance" label={t('nav.balance')} onClose={onClose} />
        <Item to={BIZ_ROUTES.tx} icon="tx" label={t('nav.tx')} onClose={onClose} />
      </nav>

      <div className="nav-label">{t('nav.sales')}</div>
      <nav className="nav-group">
        <Item to={BIZ_ROUTES.links} icon="links" label={t('nav.links')} badge={links.length} onClose={onClose} />
        <Item to={BIZ_ROUTES.invoices} icon="invoices" label={t('nav.invoices')} onClose={onClose} />
        <Item to={BIZ_ROUTES.checkout} icon="checkout" label={t('nav.checkout')} onClose={onClose} />
        <Item to={BIZ_ROUTES.customers} icon="customers" label={t('nav.customers')} onClose={onClose} />
      </nav>

      <div className="nav-label">{t('nav.services')}</div>
      <nav className="nav-group">
        <Item to={BIZ_ROUTES.exchange} icon="exchange" label={t('nav.exchange')} onClose={onClose} />
        <Item to={BIZ_ROUTES.utilities} icon="utilities" label={t('nav.utilities')} onClose={onClose} />
      </nav>

      <div className="nav-label">{t('nav.manage')}</div>
      <nav className="nav-group">
        <Item to={BIZ_ROUTES.analytics} icon="analytics" label={t('nav.analytics')} onClose={onClose} />
        <Item to={BIZ_ROUTES.team} icon="team" label={t('nav.team')} badge={team.length} onClose={onClose} />
        <button className="nav-item" onClick={() => { onOpenSettings(); onClose(); }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">{SVG.settings}</svg>
          <span>{t('nav.settings')}</span>
        </button>
      </nav>

      <div className="sidebar-foot">
        <div className="upgrade-card">
          <h4>{t('up.title')}</h4>
          <p>{t('up.sub')}</p>
          <button onClick={onOpenUpgrade}>{t('up.btn')}</button>
        </div>
      </div>
    </aside>
  );
}
