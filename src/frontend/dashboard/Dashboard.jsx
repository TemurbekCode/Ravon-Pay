import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useLanguage } from '../../hooks/useLanguage.js';
import { useReveal } from '../../hooks/useReveal.js';
import { DASH_I18N } from './dashboard.i18n.js';
import { WalletProvider } from '../providers/WalletProvider.jsx';

import Sidebar from './userDashboard/Sidebar.jsx';
import Topbar from './userDashboard/Topbar.jsx';
import BottomNav from './userDashboard/BottomNav.jsx';
import SettingsModal from './userDashboard/SettingsModal.jsx';
import './Dashboard.scss';

/**
 * Dashboard qobig'i — sidebar, topbar, bottom nav, settings modal.
 * Ichki sahifalar <Outlet /> orqali ko'rsatiladi (router bolalar).
 */
function DashboardShell() {
  const { lang } = useLanguage();
  const { pathname } = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useReveal([pathname]);

  // Dashboard'ning o'z tarjimasi
  const t = (key) => DASH_I18N[lang]?.[key] ?? DASH_I18N.uz[key] ?? key;

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="app">
      <Sidebar
        open={sidebarOpen}
        onClose={closeSidebar}
        onOpenSettings={() => setSettingsOpen(true)}
        t={t}
      />
      <div className={`overlay ${sidebarOpen ? 'show' : ''}`} onClick={closeSidebar} />

      <main className="main">
        <Topbar onMenu={() => setSidebarOpen(true)} onOpenSettings={() => setSettingsOpen(true)} t={t} />
        <div className="content">
          {/* Ichki sahifaga 't' ni context orqali emas, Outlet context bilan beramiz */}
          <Outlet context={{ t }} />
        </div>
      </main>

      <BottomNav onOpenSettings={() => setSettingsOpen(true)} t={t} />
      <SettingsModal show={settingsOpen} onClose={() => setSettingsOpen(false)} t={t} />
    </div>
  );
}

export default function Dashboard() {
  return (
    <WalletProvider>
      <DashboardShell />
    </WalletProvider>
  );
}
