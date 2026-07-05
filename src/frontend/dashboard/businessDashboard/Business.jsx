import { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useLanguage } from '../../../hooks/useLanguage.js';
import { useReveal } from '../../../hooks/useReveal.js';
import { useBusiness } from '../../../hooks/useBusiness.js';
import { useAuth } from '../../../hooks/useAuth.js';
import { useToast } from '../../../hooks/useToast.js';
import { ROUTES } from '../../../utils/constants.js';
import { BIZ_I18N } from './business.i18n.js';
import { ToastProvider } from './ToastContext.jsx';
import { BusinessProvider } from '../../providers/BusinessProvider.jsx';
import BizSidebar from './BizSidebar.jsx';
import BizTopbar from './BizTopbar.jsx';
import BizBottomNav from './BizBottomNav.jsx';
import BizSettingsModal from './BizSettingsModal.jsx';
import UpgradeProModal from './UpgradeProModal.jsx';
import './Business.scss';

// Ichki qobiq (Toast context ichida bo'lishi kerak)
function BusinessShell() {
  const { lang } = useLanguage();
  const { showToast } = useToast();
  const { pathname } = useLocation();
  const { subscription, subscribe, cards, loading } = useBusiness();
  const { profiles, activateProfile, switchAccount } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  useReveal([pathname]);

  const t = (key) => BIZ_I18N[lang]?.[key] ?? BIZ_I18N.uz[key] ?? key;
  const closeSidebar = () => setSidebarOpen(false);
  const newLink = () => showToast(t('toast.new'));

  const handleUpgrade = async (plan, cardPayload) => {
    await subscribe(plan, cardPayload);
    showToast(t('pro.success'));
  };

  // Obuna sotib olishni xohlamagan foydalanuvchi shaxsiy profiliga qaytadi
  // (agar hali faollashtirmagan bo'lsa, avtomatik bo'sh shaxsiy profil ochiladi).
  const handleBack = async () => {
    if (!profiles.includes('personal')) await activateProfile('personal', {});
    else await switchAccount('personal');
    navigate(ROUTES.dashboard);
  };

  if (loading) return null;

  // Obuna faol bo'lmasa (va hisob founder bo'lmasa) — biznes dashboard butunlay
  // yopiq, faqat reja tanlab to'lov qilingandan keyin ochiladi.
  if (!subscription.active && !subscription.founder) {
    return <UpgradeProModal show mandatory onSubscribe={subscribe} onBack={handleBack} cards={cards} t={t} />;
  }

  return (
    <div className="app">
      <BizSidebar open={sidebarOpen} onClose={closeSidebar} onOpenSettings={() => setSettingsOpen(true)} onOpenUpgrade={() => setUpgradeOpen(true)} t={t} />
      <div className={`overlay ${sidebarOpen ? 'show' : ''}`} onClick={closeSidebar} />
      <main className="main">
        <BizTopbar onMenu={() => setSidebarOpen(true)} onOpenSettings={() => setSettingsOpen(true)} showToast={showToast} t={t} />
        <div className="content">
          <Outlet context={{ t, showToast }} />
        </div>
      </main>
      <BizBottomNav onOpenSettings={() => setSettingsOpen(true)} onNewLink={newLink} t={t} />
      <BizSettingsModal show={settingsOpen} onClose={() => setSettingsOpen(false)} t={t} />
      <UpgradeProModal show={upgradeOpen} onClose={() => setUpgradeOpen(false)} onSubscribe={handleUpgrade} currentPlan={subscription.plan} cards={cards} t={t} />
    </div>
  );
}

// Business dashboard qobig'i — Toast va biznes ma'lumotlari bilan o'raladi
export default function Business() {
  return (
    <ToastProvider>
      <BusinessProvider>
        <BusinessShell />
      </BusinessProvider>
    </ToastProvider>
  );
}
