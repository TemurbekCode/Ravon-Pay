import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';

import Landing from '../frontend/landing/Landing.jsx';
import Login from '../frontend/auth/Login.jsx';
import Register from '../frontend/auth/Register.jsx';

// Personal dashboard
import Dashboard from '../frontend/dashboard/Dashboard.jsx';
import Home from '../frontend/dashboard/pages/Home.jsx';
import Wallet from '../frontend/dashboard/pages/Wallet.jsx';
import Cards from '../frontend/dashboard/pages/Cards.jsx';
import Receive from '../frontend/dashboard/pages/Receive.jsx';
import Send from '../frontend/dashboard/pages/Send.jsx';
import Exchange from '../frontend/dashboard/pages/Exchange.jsx';
import Utilities from '../frontend/dashboard/pages/Utilities.jsx';
import History from '../frontend/dashboard/pages/History.jsx';
import AIAdviser from '../frontend/dashboard/pages/AIAdviser.jsx';
import Settings from '../frontend/dashboard/pages/Settings.jsx';
import Profile from '../frontend/dashboard/pages/Profile.jsx';

// Business dashboard
import Business from '../frontend/dashboard/businessDashboard/Business.jsx';
import Overview from '../frontend/dashboard/businessDashboard/pages/Overview.jsx';
import BizBalance from '../frontend/dashboard/businessDashboard/pages/Balance.jsx';
import BizTransactions from '../frontend/dashboard/businessDashboard/pages/Transactions.jsx';
import BizLinks from '../frontend/dashboard/businessDashboard/pages/Links.jsx';
import BizInvoices from '../frontend/dashboard/businessDashboard/pages/Invoices.jsx';
import BizCheckout from '../frontend/dashboard/businessDashboard/pages/Checkout.jsx';
import BizCustomers from '../frontend/dashboard/businessDashboard/pages/Customers.jsx';
import BizAnalytics from '../frontend/dashboard/businessDashboard/pages/Analytics.jsx';
import BizTeam from '../frontend/dashboard/businessDashboard/pages/Team.jsx';
import BizExchange from '../frontend/dashboard/businessDashboard/pages/Exchange.jsx';
import BizUtilities from '../frontend/dashboard/businessDashboard/pages/Utilities.jsx';

// Admin panel (asoschining shaxsiy paneli)
import AdminDashboard from '../frontend/admin/AdminDashboard.jsx';

function Protected({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <div style={{ display: 'grid', placeItems: 'center', minHeight: '100vh' }}>Yuklanmoqda...</div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
}

function AdminProtected({ children }) {
  const { isAuthenticated, loading, user } = useAuth();
  if (loading) return <div style={{ display: 'grid', placeItems: 'center', minHeight: '100vh' }}>Yuklanmoqda...</div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role !== 'admin') return <Navigate to="/dashboard" replace />;
  return children;
}

export default function AppRouter() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Personal dashboard (himoyalangan) */}
      <Route path="/dashboard" element={<Protected><Dashboard /></Protected>}>
        <Route index element={<Home />} />
        <Route path="wallet" element={<Wallet />} />
        <Route path="cards" element={<Cards />} />
        <Route path="receive" element={<Receive />} />
        <Route path="send" element={<Send />} />
        <Route path="exchange" element={<Exchange />} />
        <Route path="utilities" element={<Utilities />} />
        <Route path="history" element={<History />} />
        <Route path="ai-adviser" element={<AIAdviser />} />
        <Route path="settings" element={<Settings />} />
        <Route path="profile" element={<Profile />} />
      </Route>

      {/* Business dashboard (himoyalangan) */}
      <Route path="/business" element={<Protected><Business /></Protected>}>
        <Route index element={<Overview />} />
        <Route path="balance" element={<BizBalance />} />
        <Route path="transactions" element={<BizTransactions />} />
        <Route path="links" element={<BizLinks />} />
        <Route path="invoices" element={<BizInvoices />} />
        <Route path="checkout" element={<BizCheckout />} />
        <Route path="customers" element={<BizCustomers />} />
        <Route path="analytics" element={<BizAnalytics />} />
        <Route path="team" element={<BizTeam />} />
        <Route path="exchange" element={<BizExchange />} />
        <Route path="utilities" element={<BizUtilities />} />
      </Route>

      {/* Admin panel (faqat role='admin') */}
      <Route path="/admin" element={<AdminProtected><AdminDashboard /></AdminProtected>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
