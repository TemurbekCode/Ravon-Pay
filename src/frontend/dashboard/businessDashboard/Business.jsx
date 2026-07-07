import { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useLanguage } from '../../../hooks/useLanguage.js';
import { useReveal } from '../../../hooks/useReveal.js';
import { useSwipeNav } from '../../../hooks/useSwipeNav.js';
import { useBusiness } from '../../../hooks/useBusiness.js';
import { useAuth } from '../../../hooks/useAuth.js';
import { useToast } from '../../../hooks/useToast.js';
import { ROUTES } from '../../../utils/constants.js';
import { BIZ_I18N } from './business.i18n.js';
import { BIZ_ROUTES } from './business.routes.js';
import { ToastProvider } from './ToastContext.jsx';
import { BusinessProvider } from '../../providers/BusinessProvider.jsx';
import SplashScreen from '../../shared/SplashScreen.jsx';
import BizSidebar from './BizSidebar.jsx';
import BizTopbar from './BizTopbar.jsx';
import BizBottomNav from './BizBottomNav.jsx';
import BizSettingsModal from './BizSettingsModal.jsx';
import UpgradeProModal from './UpgradeProModal.jsx';
import CreateItemModal from './CreateItemModal.jsx';
import './Business.scss';

// Shaxsiy tomondagi bilan bir xil naqsh — markazdagi "Havola" FAB bu ketma-
// ketlikka kirmaydi, "Sozlamalar" esa modal ({ modal: true }).
const BIZ_SWIPE_STOPS = [
  { route: BIZ_ROUTES.overview },
  { route: BIZ_ROUTES.tx },
  { route: BIZ_ROUTES.customers },
  { modal: true },
];

// Ichki qobiq (Toast context ichida bo'lishi kerak)
function BusinessShell() {
  const { lang } = useLanguage();
  const { showToast } = useToast();
  const { pathname } = useLocation();
  const { subscription, subscribe, cards, createLink, loading } = useBusiness();
  const { profiles, activateProfile, switchAccount } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [newLinkOpen, setNewLinkOpen] = useState(false);
  const swipeHandlers = useSwipeNav(BIZ_SWIPE_STOPS, () => setSettingsOpen(true));

  useReveal([pathname]);

  const t = (key) => BIZ_I18N[lang]?.[key] ?? BIZ_I18N.uz[key] ?? key;
  const closeSidebar = () => setSidebarOpen(false);
  const newLink = () => setNewLinkOpen(true);

  // Havola qaysi sahifadan yaratilgan bo'lishidan qat'i nazar, natijani darhol
  // ko'rsatish uchun Havolalar sahifasiga o'tkaziladi.
  const handleCreateLink = async (v) => {
    await createLink(v.title, Number(v.amount));
    navigate(BIZ_ROUTES.links);
    showToast(t('links.created'));
  };

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

  if (loading) return <SplashScreen />;

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
        <div className="content" {...swipeHandlers}>
          <Outlet context={{ t, showToast }} />
        </div>
      </main>
      <BizBottomNav onOpenSettings={() => setSettingsOpen(true)} onNewLink={newLink} t={t} />
      <BizSettingsModal show={settingsOpen} onClose={() => setSettingsOpen(false)} t={t} />
      <UpgradeProModal show={upgradeOpen} onClose={() => setUpgradeOpen(false)} onSubscribe={handleUpgrade} currentPlan={subscription.plan} cards={cards} t={t} />
      <CreateItemModal
        t={t}
        show={newLinkOpen}
        onClose={() => setNewLinkOpen(false)}
        title={t('links.new')}
        submitLabel={t('links.new')}
        fields={[
          { name: 'title', label: t('links.name') },
          { name: 'amount', label: t('th.amount'), type: 'number', placeholder: '0' },
        ]}
        onSubmit={handleCreateLink}
      />
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
