import { useEffect, useState } from 'react';
import { Check, Clock3, Megaphone, RadioTower } from 'lucide-react';
import SectionHeader from '../components/SectionHeader.jsx';
import { useAppSettings } from '../context/AppSettings.jsx';
import { api, formatDate } from '../lib/api.js';

const categoryKeys = {
  'Tiffin Theft': 'categoryTiffin', Bribes: 'categoryBribes', 'Syllabus Bloat': 'categorySyllabus',
  'Unfair Sports': 'categorySports', 'Washroom Toll': 'categoryWashroom', Other: 'categoryOther'
};
const locationKeys = {
  Library: 'locationLibrary', Playground: 'locationPlayground', Corridor: 'locationCorridor',
  Classroom: 'locationClassroom', Canteen: 'locationCanteen', Washroom: 'locationWashroom', 'School Gate': 'locationGate'
};

export default function CaptainPage({ notify, onSummary }) {
  const { t, language } = useAppSettings();
  const [complaints, setComplaints] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      const [complaintData, alertData, summary] = await Promise.all([api('/complaints'), api('/sos'), api('/dashboard')]);
      setComplaints(complaintData);
      setAlerts(alertData);
      onSummary(summary);
    } catch (error) {
      if (error.code !== 'NETWORK_ERROR') notify(error.message, 'error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const timer = setInterval(() => navigator.onLine && load(), 5000);
    return () => clearInterval(timer);
  }, []);

  async function resolve(id) {
    try {
      await api(`/sos/${id}/resolve`, { method: 'PATCH' });
      notify(t('alertResolved'));
      await load();
    } catch (error) {
      notify(error.message, 'error');
    }
  }

  const active = alerts.filter((alert) => alert.status === 'active');

  return (
    <div>
      <SectionHeader eyebrow="Biltu & Miltu" title={t('navCaptain')} description={t('captainBoardDescription')} actions={<button className="button ghost" onClick={load} type="button">{t('refreshNow')}</button>} />
      {loading ? <div className="loading-card">{t('loadingCommand')}</div> : (
        <>
          <section className="panel captain-alerts">
            <div className="panel-title"><div className="panel-icon danger"><RadioTower /></div><div><h2>{t('distressSignals')}</h2><p>{t('alertsNeedAttention', { count: active.length })}</p></div></div>
            <div className="alert-grid">
              {active.length ? active.map((alert) => <article className="alert-card" key={alert.id}><div><span className="live-dot" />{t('liveSos')}</div><h3>{t(locationKeys[alert.location] || alert.location)}</h3><p><Clock3 size={15} /> {formatDate(alert.created_at, language)}</p><button className="button danger-button" type="button" onClick={() => resolve(alert.id)}><Check size={17} /> {t('markResolved')}</button></article>) : <div className="empty-state"><Check /><strong>{t('allClear')}</strong><span>{t('noActiveSignals')}</span></div>}
            </div>
          </section>

          <section className="panel table-panel">
            <div className="panel-title"><div className="panel-icon"><Megaphone /></div><div><h2>{t('complaintFeed')}</h2><p>{t('rollsAbsent')}</p></div></div>
            <div className="complaint-feed">{complaints.map((item) => <article key={item.id}><div><span className="status-tag complaint">{t(categoryKeys[item.category] || item.category)}</span><time>{formatDate(item.created_at, language)}</time></div><p>{item.description}</p></article>)}</div>
          </section>
        </>
      )}
    </div>
  );
}
