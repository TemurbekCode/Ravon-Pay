import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.js';
import { useReveal } from '../../hooks/useReveal.js';
import { adminService } from '../../services/adminService.js';
import { apiClient } from '../../services/apiClient.js';
import { formatCurrency } from '../../utils/formatCurrency.js';
import { ROUTES } from '../../utils/constants.js';
import SplashScreen from '../shared/SplashScreen.jsx';
import '../dashboard/businessDashboard/Business.scss';
import './AdminDashboard.scss';

// RavonPay asoschisining shaxsiy paneli — faqat role='admin' bo'lgan hisob
// (ravonpay@gmail.com) kira oladi. Uch bo'lim: umumiy statistika + biznes
// tasdiqlash so'rovlari, foydalanuvchilarni qidirish/ko'rish/bloklash, va
// butun platforma bo'ylab tranzaksiyalar (audit).
export default function AdminDashboard() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('overview');
  const [overview, setOverview] = useState(null);
  const [verifications, setVerifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState('');

  const [users, setUsers] = useState([]);
  const [usersLoaded, setUsersLoaded] = useState(false);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [userBusy, setUserBusy] = useState(false);

  const [transactions, setTransactions] = useState([]);
  const [txLoaded, setTxLoaded] = useState(false);

  useReveal([tab]);

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

  const loadUsers = async (q) => {
    const res = await adminService.listUsers(q);
    setUsers(res.users);
    setUsersLoaded(true);
  };

  useEffect(() => {
    if (tab === 'users' && !usersLoaded) {
      adminService.listUsers('').then((res) => { setUsers(res.users); setUsersLoaded(true); });
    }
    if (tab === 'transactions' && !txLoaded) {
      adminService.listTransactions().then((res) => { setTransactions(res.transactions); setTxLoaded(true); });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const handleSearch = (e) => { e.preventDefault(); loadUsers(search); };

  const openUser = async (userId) => setSelected(await adminService.getUser(userId));

  const toggleBlock = async (user) => {
    setUserBusy(true);
    try {
      if (user.blocked) await adminService.unblockUser(user.id);
      else await adminService.blockUser(user.id);
      setSelected(await adminService.getUser(user.id));
      loadUsers(search);
    } finally {
      setUserBusy(false);
    }
  };

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

  if (loading) return <SplashScreen />;

  return (
    <div className="admin-shell">
      <header className="admin-header">
        <div className="admin-header-title">Admin</div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn-ghost" onClick={() => navigate(ROUTES.dashboard)}>Qaytish</button>
          <button className="btn-ghost" onClick={handleLogout}>Chiqish</button>
        </div>
      </header>

      <div className="admin-content">
        <div className="admin-tabs reveal">
          <button className={tab === 'overview' ? 'active' : ''} onClick={() => setTab('overview')}>Umumiy holat</button>
          <button className={tab === 'users' ? 'active' : ''} onClick={() => setTab('users')}>Foydalanuvchilar</button>
          <button className={tab === 'transactions' ? 'active' : ''} onClick={() => setTab('transactions')}>Tranzaksiyalar</button>
        </div>

        {tab === 'overview' && (
          <>
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
          </>
        )}

        {tab === 'users' && (
          <>
            <form onSubmit={handleSearch} className="admin-search-row reveal">
              <input
                className="admin-search"
                placeholder="Ism, telefon yoki email bo'yicha qidirish..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <button type="submit" className="btn-new">Qidirish</button>
            </form>
            <div className="panel reveal">
              {users.length === 0 ? (
                <p style={{ color: 'var(--text-muted)' }}>Hech kim topilmadi.</p>
              ) : (
                <div className="tbl-wrap">
                  <table className="tbl">
                    <thead><tr><th>Ism</th><th>Telefon</th><th>Turi</th><th>Holat</th><th></th></tr></thead>
                    <tbody>
                      {users.map((u) => (
                        <tr key={u.id}>
                          <td>{u.fullName}</td>
                          <td>{u.phone}</td>
                          <td>{u.accountType === 'business' ? 'Biznes' : 'Shaxsiy'}</td>
                          <td><span className={`pill ${u.blocked ? 'pending' : 'done'}`}>{u.blocked ? 'Bloklangan' : 'Faol'}</span></td>
                          <td><button className="panel-link" onClick={() => openUser(u.id)}>Ko'rish</button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        {tab === 'transactions' && (
          <div className="panel reveal">
            {transactions.length === 0 ? (
              <p style={{ color: 'var(--text-muted)' }}>Tranzaksiyalar yo'q.</p>
            ) : (
              <div className="tbl-wrap">
                <table className="tbl">
                  <thead><tr><th>Foydalanuvchi</th><th>Telefon</th><th>Tavsif</th><th>Turi</th><th>Summasi</th><th>Holat</th></tr></thead>
                  <tbody>
                    {transactions.map((t) => (
                      <tr key={t.id}>
                        <td>{t.userName}</td>
                        <td>{t.userPhone}</td>
                        <td>{t.name}</td>
                        <td>{t.source === 'business' ? 'Biznes' : 'Shaxsiy'}</td>
                        <td style={{ color: t.in ? 'var(--success)' : 'var(--error)' }}>
                          {t.in ? '+' : '−'}{formatCurrency(t.amount)} so'm
                        </td>
                        <td><span className="pill done">{t.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {selected?.user && (
        <div className="modal-overlay show" onClick={(e) => { if (e.target === e.currentTarget) setSelected(null); }}>
          <div className="modal">
            <div className="modal-head">
              <h3>{selected.user.fullName}</h3>
              <button className="modal-close" onClick={() => setSelected(null)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12" /></svg>
              </button>
            </div>

            <p style={{ color: 'var(--text-muted)', marginBottom: 16 }}>
              {selected.user.phone}{selected.user.email && ` · ${selected.user.email}`} · {selected.user.accountType === 'business' ? 'Biznes' : 'Shaxsiy'}
            </p>

            <div className="kpi-row" style={{ marginBottom: 20 }}>
              <div className="kpi-sm"><div className="n">{formatCurrency(selected.wallet.balance)}</div><div className="c">Hamyon balansi</div></div>
              {selected.business && (
                <div className="kpi-sm"><div className="n">{formatCurrency(selected.business.balance)}</div><div className="c">Biznes balansi</div></div>
              )}
            </div>

            <button
              className={selected.user.blocked ? 'btn-new' : 'btn-ghost'}
              disabled={userBusy || selected.user.role === 'admin'}
              onClick={() => toggleBlock(selected.user)}
              style={{ marginBottom: 20 }}
            >
              {selected.user.blocked ? 'Blokdan chiqarish' : 'Bloklash'}
            </button>

            <h4 style={{ marginBottom: 10 }}>Oxirgi operatsiyalar</h4>
            {[...selected.wallet.transactions, ...selected.businessTransactions].length === 0 ? (
              <p style={{ color: 'var(--text-muted)' }}>Operatsiyalar yo'q.</p>
            ) : (
              <div className="tbl-wrap">
                <table className="tbl">
                  <thead><tr><th>Tavsif</th><th>Summasi</th><th>Holat</th></tr></thead>
                  <tbody>
                    {[...selected.wallet.transactions, ...selected.businessTransactions].map((t) => (
                      <tr key={t.id}>
                        <td>{t.name}</td>
                        <td style={{ color: t.amount > 0 ? 'var(--success)' : 'var(--error)' }}>
                          {t.amount > 0 ? '+' : '−'}{formatCurrency(t.amount)} so'm
                        </td>
                        <td><span className="pill done">{t.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
