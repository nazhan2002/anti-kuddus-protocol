import { useEffect, useMemo, useState } from 'react';
import {
  BookOpenCheck, CheckSquare2, Coins, LayoutDashboard, LayoutGrid,
  LogOut, Megaphone, Menu, Radar, SearchCheck, ShieldCheck, X
} from 'lucide-react';
import Brand from './components/Brand.jsx';
import Toast from './components/Toast.jsx';
import AppTools from './components/AppTools.jsx';
import ConnectivityBadge from './components/ConnectivityBadge.jsx';
import { useAppSettings } from './context/AppSettings.jsx';
import { api } from './lib/api.js';
import { getQueuedSos, syncQueuedSos } from './lib/offlineQueue.js';
import LoginPage from './pages/LoginPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import ComplaintPage from './pages/ComplaintPage.jsx';
import SeatPlannerPage from './pages/SeatPlannerPage.jsx';
import SyllabusPage from './pages/SyllabusPage.jsx';
import LedgerPage from './pages/LedgerPage.jsx';
import SosPage from './pages/SosPage.jsx';
import FactCheckerPage from './pages/FactCheckerPage.jsx';
import CaptainPage from './pages/CaptainPage.jsx';
import ChecklistPage from './pages/ChecklistPage.jsx';

const studentItems = [
  ['dashboard', 'navOverview', LayoutDashboard],
  ['complaints', 'navWhistleblower', Megaphone],
  ['seats', 'navSeats', LayoutGrid],
  ['syllabus', 'navSyllabus', BookOpenCheck],
  ['ledger', 'navLedger', Coins],
  ['sos', 'navSos', Radar],
  ['facts', 'navFacts', SearchCheck],
  ['checklist', 'navChecklist', CheckSquare2]
];

const captainItems = [
  ['dashboard', 'navOverview', LayoutDashboard],
  ['captain', 'navCaptain', ShieldCheck],
  ['ledger', 'navLedger', Coins],
  ['facts', 'navFacts', SearchCheck],
  ['checklist', 'navChecklist', CheckSquare2]
];

export default function App() {
  const { t } = useAppSettings();
  const [user, setUser] = useState(() => {
    const token = localStorage.getItem('ak_token');
    const role = localStorage.getItem('ak_role');
    const alias = localStorage.getItem('ak_alias');
    return token && role ? { token, role, alias } : null;
  });
  const [page, setPage] = useState('dashboard');
  const [summary, setSummary] = useState(null);
  const [toast, setToast] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [queuedSos, setQueuedSos] = useState(() => getQueuedSos().length);

  const navItems = useMemo(() => user?.role === 'captain' ? captainItems : studentItems, [user?.role]);

  useEffect(() => {
    if (!user) return;
    api('/dashboard').then(setSummary).catch((error) => {
      if (error.status === 401) logout();
      else if (error.code !== 'NETWORK_ERROR') notify(error.message, 'error');
    });
  }, [user]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    const updateQueue = (event) => setQueuedSos(event?.detail?.count ?? getQueuedSos().length);
    const sync = async () => {
      if (!user || !navigator.onLine || user.role !== 'student') return;
      const result = await syncQueuedSos();
      setQueuedSos(result.remaining);
      if (result.sent > 0) notify(t('offlineSosSynced', { count: result.sent }));
    };
    window.addEventListener('ak:sos-queue-change', updateQueue);
    window.addEventListener('online', sync);
    sync();
    return () => {
      window.removeEventListener('ak:sos-queue-change', updateQueue);
      window.removeEventListener('online', sync);
    };
  }, [user, t]);

  function notify(message, type = 'success') {
    setToast({ message, type });
  }

  function login(result) {
    localStorage.setItem('ak_token', result.token);
    localStorage.setItem('ak_role', result.role);
    localStorage.setItem('ak_alias', result.alias);
    setUser(result);
    setPage('dashboard');
    notify(t('welcome', { name: result.alias }));
  }

  function logout() {
    localStorage.removeItem('ak_token');
    localStorage.removeItem('ak_role');
    localStorage.removeItem('ak_alias');
    setUser(null);
    setSummary(null);
    setPage('dashboard');
  }

  function navigate(target) {
    setPage(target);
    setMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  if (!user) return <><LoginPage onLogin={login} /><Toast toast={toast} onClose={() => setToast(null)} /></>;

  const pageProps = { summary, onSummary: setSummary, notify, role: user.role, onNavigate: navigate, queuedSos };
  const screens = {
    dashboard: <DashboardPage {...pageProps} />,
    complaints: <ComplaintPage {...pageProps} />,
    seats: <SeatPlannerPage {...pageProps} />,
    syllabus: <SyllabusPage {...pageProps} />,
    ledger: <LedgerPage {...pageProps} />,
    sos: <SosPage {...pageProps} />,
    facts: <FactCheckerPage {...pageProps} />,
    captain: <CaptainPage {...pageProps} />,
    checklist: <ChecklistPage {...pageProps} />
  };

  const currentLabel = t(navItems.find(([id]) => id === page)?.[1] || 'navOverview');
  const mobilePrimary = user.role === 'captain' ? 'captain' : 'sos';
  const MobilePrimaryIcon = user.role === 'captain' ? ShieldCheck : Radar;

  return (
    <div className="app-shell">
      <aside className={`sidebar ${menuOpen ? 'open' : ''}`}>
        <div className="sidebar-top">
          <Brand compact />
          <button className="mobile-close" onClick={() => setMenuOpen(false)} type="button"><X /></button>
        </div>
        <div className="role-card">
          <div className="avatar">{user.role === 'captain' ? 'BM' : user.alias?.slice(-2)}</div>
          <div><strong>{user.alias}</strong><span>{user.role === 'captain' ? t('captainAccess') : t('anonymousStudent')}</span></div>
        </div>
        <nav>
          <span className="nav-label">{t('navLabel')}</span>
          {navItems.map(([id, labelKey, Icon]) => (
            <button key={id} className={page === id ? 'active' : ''} onClick={() => navigate(id)} type="button"><Icon size={19} /><span>{t(labelKey)}</span></button>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="system-status"><span className="status-dot" /><div><strong>{navigator.onLine ? t('systemOperational') : t('systemOfflineReady')}</strong><small>Secure API + SQL Database · PWA</small></div></div>
          <button className="logout-button" onClick={logout} type="button"><LogOut size={18} /> {t('logout')}</button>
        </div>
      </aside>

      {menuOpen && <button className="sidebar-overlay" aria-label="Close navigation" onClick={() => setMenuOpen(false)} />}

      <div className="main-shell">
        <header className="topbar">
          <button className="menu-button" onClick={() => setMenuOpen(true)} type="button"><Menu /></button>
          <div className="topbar-title"><span>{t('appTitle')}</span><strong>{currentLabel}</strong></div>
          <div className="topbar-actions">
            <ConnectivityBadge queued={queuedSos} />
            <AppTools />
            <div className="topbar-badge"><ShieldCheck size={16} /> {t('baselineComplete')}</div>
          </div>
        </header>
        <main className="content-area">{screens[page] || screens.dashboard}</main>
        <footer className="app-footer"><span>{t('builtFor')}</span><span>{t('eventName')}</span></footer>
      </div>

      <nav className="mobile-bottom-nav" aria-label="Mobile navigation">
        <button className={page === 'dashboard' ? 'active' : ''} onClick={() => navigate('dashboard')} type="button"><LayoutDashboard /><span>{t('navOverview')}</span></button>
        <button className={page === mobilePrimary ? 'active' : ''} onClick={() => navigate(mobilePrimary)} type="button"><MobilePrimaryIcon /><span>{user.role === 'captain' ? t('navCaptain') : t('navSos')}</span></button>
        <button onClick={() => setMenuOpen(true)} type="button"><Menu /><span>{t('menu')}</span></button>
      </nav>
      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}
