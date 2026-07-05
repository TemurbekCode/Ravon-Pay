import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.js';
import { adminService } from '../../services/adminService.js';
import { apiClient } from '../../services/apiClient.js';
import { ROUTES } from '../../utils/constants.js';
import '../dashboard/businessDashboard/Business.scss';
import './AdminDashboard.scss';

// RavonPay asoschisining shaxsiy paneli — faqat role='admin' bo'lgan hisob
// (ravonpay@gmail.com) kira oladi. Hozircha biznes tasdiqlash so'rovlarini
// ko'rib chiqish/tasdiqlash/rad etish va umumiy statistikani ko'rsatadi.
export default function AdminDashboard() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [overview, setOverview] = useState(null);
  const [verifications, setVerifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState('');

  const reload = async () => {
    const [ov, vr] = await Promise.all([adminService.getOverview(), adminService.listVerifications()]);
    setOverview(ov);
    setVerifications(vr.verifications);
  };

  useEffect(() => {
    Promise.all([adminService.getOverview(), adminService.listVerifications()])
      .then(([ov, vr]) => { setOverview(ov); setVerifications(vr.verifications); })
      .finally(() => setLoading(false));
  }, []);

  const approve = async (userId) => {
    setBusyId(userId);
    try { await adminService.approveVerification(userId); await reload(); } finally { setBusyId(''); }
  };
  const reject = async (userId) => {
    setBusyId(userId);
    try { await adminService.rejectVerification(userId); await reload(); } finally { setBusyId(''); }
  };

  // Oddiy <a href> ishlamaydi — bu endpoint autentifikatsiya talab qiladi,
  // brauzer esa oddiy havola bosilganda Authorization headerini yubormaydi.
  const viewDocument = async (userId) => {
    const blob = await apiClient.get(`/admin/verifications/${userId}/document`, { responseType: 'blob' });
    window.open(URL.createObjectURL(blob), '_blank');
  };

  const handleLogout = () => { logout(); navigate(ROUTES.login); };

  if (loading) return <div style={{ display: 'grid', placeItems: 'center', minHeight: '100vh' }}>Yuklanmoqda...</div>;

  return (
    <div className="admin-shell">
      <header className="admin-header">
        <div className="admin-header-title">RavonPay — Admin</div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn-ghost" onClick={() => navigate(ROUTES.dashboard)}>Ilovaga qaytish</button>
          <button className="btn-ghost" onClick={handleLogout}>Chiqish</button>
        </div>
      </header>

      <div className="admin-content">
        <div className="page-head reveal"><div><h1>Umumiy holat</h1></div></div>
        <div className="kpi-row">
          <div className="kpi-sm reveal"><div className="n">{overview.totalUsers}</div><div className="c">Jami foydalanuvchilar</div></div>
          <div className="kpi-sm reveal"><div className="n">{overview.personalUsers}</div><div className="c">Shaxsiy hisoblar</div></div>
          <div className="kpi-sm reveal"><div className="n">{overview.businessUsers}</div><div className="c">Biznes hisoblar</div></div>
          <div className="kpi-sm reveal"><div className="n">{overview.pendingVerifications}</div><div className="c">Ko'rib chiqilmoqda</div></div>
          <div className="kpi-sm reveal"><div className="n">{overview.verifiedBusinesses}</div><div className="c">Tasdiqlangan</div></div>
        </div>

        <div className="page-head reveal" style={{ marginTop: 32 }}><div><h1>Biznes tasdiqlash so'rovlari</h1></div></div>
        <div className="panel reveal">
          {verifications.length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }}>Hozircha so'rovlar yo'q.</p>
          ) : (
            <div className="tbl-wrap">
              <table className="tbl">
                <thead>
                  <tr><th>Kompaniya</th><th>Egasi</th><th>Telefon</th><th>STIR</th><th>Yuridik manzil</th><th>Hujjat</th><th>Holat</th><th></th></tr>
                </thead>
                <tbody>
                  {verifications.map((v) => (
                    <tr key={v.userId}>
                      <td>{v.companyName || '—'}</td>
                      <td>{v.fullName}</td>
                      <td>{v.phone}</td>
                      <td>{v.taxId}</td>
                      <td>{v.legalAddress}</td>
                      <td>{v.documentUploaded ? <button className="panel-link" onClick={() => viewDocument(v.userId)}>Ko'rish</button> : '—'}</td>
                      <td><span className={`pill ${v.status === 'pending' ? 'pending' : 'done'}`}>{v.status === 'pending' ? "Ko'rib chiqilmoqda" : 'Tasdiqlangan'}</span></td>
                      <td>
                        {v.status === 'pending' && (
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button className="btn-new" disabled={busyId === v.userId} onClick={() => approve(v.userId)}>Tasdiqlash</button>
                            <button className="btn-ghost" disabled={busyId === v.userId} onClick={() => reject(v.userId)}>Rad etish</button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
