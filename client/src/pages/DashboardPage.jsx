import { AlertTriangle, BookOpenCheck, Coins, LayoutGrid, Megaphone, Radar, SearchCheck, UtensilsCrossed } from 'lucide-react';
import SectionHeader from '../components/SectionHeader.jsx';
import StrikeMeter from '../components/StrikeMeter.jsx';
import { useAppSettings } from '../context/AppSettings.jsx';

const missionCards = [
  { id: 'complaints', mission: 'mission01', title: 'm1Title', text: 'm1Text', icon: Megaphone },
  { id: 'seats', mission: 'mission02', title: 'm2Title', text: 'm2Text', icon: LayoutGrid },
  { id: 'syllabus', mission: 'mission03', title: 'm3Title', text: 'm3Text', icon: BookOpenCheck },
  { id: 'ledger', mission: 'mission04', title: 'm4Title', text: 'm4Text', icon: Coins },
  { id: 'sos', mission: 'mission05', title: 'm5Title', text: 'm5Text', icon: Radar },
  { id: 'facts', mission: 'mission06', title: 'm6Title', text: 'm6Text', icon: SearchCheck }
];

export default function DashboardPage({ summary, role, onNavigate }) {
  const { t } = useAppSettings();
  return (
    <div>
      <SectionHeader
        eyebrow={t('commandCentre')}
        title={role === 'captain' ? t('captainDashboard') : t('studentDashboard')}
        description={role === 'captain' ? t('captainDashboardDescription') : t('studentDashboardDescription')}
      />

      <StrikeMeter summary={summary} />

      <section className="metric-grid">
        <article className="metric-card"><div className="metric-icon"><Megaphone /></div><div><span>{t('totalReports')}</span><strong>{summary?.complaintTotal ?? 0}</strong><small>{t('anonymousComplaintLog')}</small></div></article>
        <article className="metric-card"><div className="metric-icon"><Coins /></div><div><span>{t('cashRecorded')}</span><strong>৳{Number(summary?.totalMoney || 0).toFixed(0)}</strong><small>{t('forcedPayments')}</small></div></article>
        <article className="metric-card"><div className="metric-icon"><UtensilsCrossed /></div><div><span>{t('tiffinsTaken')}</span><strong>{summary?.totalFood ?? 0}</strong><small>{t('foodItemsLogged')}</small></div></article>
        <article className={`metric-card ${summary?.activeSos ? 'danger' : ''}`}><div className="metric-icon"><AlertTriangle /></div><div><span>{t('activeSos')}</span><strong>{summary?.activeSos ?? 0}</strong><small>{summary?.activeSos ? t('needsAttention') : t('noDistress')}</small></div></article>
      </section>

      <div className="subsection-heading">
        <div><span className="eyebrow">{t('requiredModules')}</span><h2>{t('sixMissions')}</h2></div>
        <span className="completion-pill">{t('implemented')}</span>
      </div>

      <section className="mission-grid">
        {missionCards.map(({ id, mission, title, text, icon: Icon }) => {
          const blocked = role === 'captain' && ['complaints', 'seats', 'syllabus', 'sos'].includes(id);
          const destination = role === 'captain' && id === 'complaints' ? 'captain' : id;
          return (
            <button key={id} type="button" className="mission-card" onClick={() => onNavigate(destination)} disabled={blocked && id !== 'complaints'}>
              <div className="mission-card-top"><span>{t(mission)}</span><Icon /></div>
              <h3>{t(title)}</h3>
              <p>{blocked && id !== 'complaints' ? t('studentOnly') : t(text)}</p>
              <b>{blocked && id !== 'complaints' ? t('viewStudent') : t('openModule')}</b>
            </button>
          );
        })}
      </section>
    </div>
  );
}
