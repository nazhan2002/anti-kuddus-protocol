import { useEffect, useState } from 'react';
import { CloudOff, MapPin, Phone, Radio, Save, ShieldAlert } from 'lucide-react';
import SectionHeader from '../components/SectionHeader.jsx';
import ConnectivityBadge from '../components/ConnectivityBadge.jsx';
import { useAppSettings } from '../context/AppSettings.jsx';
import { api } from '../lib/api.js';
import { getQueuedSos, queueSos } from '../lib/offlineQueue.js';

const locations = [
  ['Library', 'locationLibrary'],
  ['Playground', 'locationPlayground'],
  ['Corridor', 'locationCorridor'],
  ['Classroom', 'locationClassroom'],
  ['Canteen', 'locationCanteen'],
  ['Washroom', 'locationWashroom'],
  ['School Gate', 'locationGate']
];

function loadContacts(t) {
  try {
    const saved = JSON.parse(localStorage.getItem('ak_emergency_contacts') || 'null');
    if (Array.isArray(saved) && saved.length === 3) return saved;
  } catch { /* use defaults */ }
  return [
    { id: 1, name: t('contact1'), phone: '' },
    { id: 2, name: t('contact2'), phone: '' },
    { id: 3, name: t('contact3'), phone: '' }
  ];
}

export default function SosPage({ notify }) {
  const { t } = useAppSettings();
  const [location, setLocation] = useState('Corridor');
  const [sent, setSent] = useState(false);
  const [queued, setQueued] = useState(() => getQueuedSos().length);
  const [online, setOnline] = useState(navigator.onLine);
  const [loading, setLoading] = useState(false);
  const [contacts, setContacts] = useState(() => loadContacts(t));

  useEffect(() => {
    const updateNetwork = () => setOnline(navigator.onLine);
    const updateQueue = (event) => setQueued(event?.detail?.count ?? getQueuedSos().length);
    window.addEventListener('online', updateNetwork);
    window.addEventListener('offline', updateNetwork);
    window.addEventListener('ak:sos-queue-change', updateQueue);
    return () => {
      window.removeEventListener('online', updateNetwork);
      window.removeEventListener('offline', updateNetwork);
      window.removeEventListener('ak:sos-queue-change', updateQueue);
    };
  }, []);

  async function sendSos() {
    setLoading(true);
    if (!navigator.onLine) {
      queueSos(location);
      setSent(true);
      setLoading(false);
      notify(t('queuedOffline'));
      return;
    }
    try {
      const result = await api('/sos', { method: 'POST', body: JSON.stringify({ location }) });
      setSent(true);
      notify(result.message);
    } catch (error) {
      if (error.code === 'NETWORK_ERROR') {
        queueSos(location);
        setSent(true);
        notify(t('queuedOffline'));
      } else {
        notify(error.message, 'error');
      }
    } finally {
      setLoading(false);
    }
  }

  function updateContact(id, field, value) {
    setContacts((current) => current.map((contact) => contact.id === id ? { ...contact, [field]: value } : contact));
  }

  function saveContacts() {
    localStorage.setItem('ak_emergency_contacts', JSON.stringify(contacts));
    notify(t('contactsSaved'));
  }

  const locationLabel = t(locations.find(([value]) => value === location)?.[1] || 'locationCorridor');

  return (
    <div>
      <SectionHeader
        eyebrow={t('mission05')}
        title={t('m5Title')}
        description={t('sosDescription')}
        actions={<ConnectivityBadge queued={queued} />}
      />
      <div className="sos-layout">
        <section className="sos-card">
          <div className="pulse-rings"><span /><span /><span /><ShieldAlert /></div>
          <span className="eyebrow danger-text">{t('emergencyChannel')}</span>
          <h2>{sent ? t('signalDelivered') : t('needBackup')}</h2>
          <p>{sent ? (online ? t('signalText', { location: locationLabel }) : t('offlineQueueNotice')) : t('selectAndSend')}</p>
          <label className="location-select"><MapPin /><select value={location} onChange={(e) => { setLocation(e.target.value); setSent(false); }}>{locations.map(([value, key]) => <option key={value} value={value}>{t(key)}</option>)}</select></label>
          <button type="button" className="sos-button" onClick={sendSos} disabled={loading}><Radio />{loading ? t('sending') : sent ? t('sendAgain') : t('sendSos')}</button>
          <small>{t('locationTimeOnly')}</small>
        </section>

        <aside className="panel sos-instructions">
          <div className="panel-title"><div className="panel-icon"><ShieldAlert /></div><div><h2>{t('whatNext')}</h2><p>{t('phoneReady')}</p></div></div>
          <ol className="number-list">
            <li><span>1</span><div><strong>{t('selectLocation')}</strong><p>{t('nearestArea')}</p></div></li>
            <li><span>2</span><div><strong>{t('sendSignal')}</strong><p>{t('serverCreates')}</p></div></li>
            <li><span>3</span><div><strong>{t('captainResponds')}</strong><p>{t('captainResolves')}</p></div></li>
          </ol>
        </aside>
      </div>

      <section className="panel offline-help-panel">
        <div className="offline-help-heading">
          <div className="panel-title"><div className="panel-icon"><CloudOff /></div><div><h2>{t('offlineHelp')}</h2><p>{t('offlineHelpText')}</p></div></div>
          <div className="offline-status-copy"><span>{t('connection')}: <b>{online ? t('online') : t('offline')}</b></span><span>{t('queueCount', { count: queued })}</span></div>
        </div>

        <div className="offline-help-grid">
          <div className="contact-editor">
            {contacts.map((contact) => (
              <div className="contact-row" key={contact.id}>
                <input aria-label={t('contactName')} value={contact.name} onChange={(event) => updateContact(contact.id, 'name', event.target.value)} placeholder={t('contactName')} />
                <input aria-label={t('phoneNumber')} inputMode="tel" value={contact.phone} onChange={(event) => updateContact(contact.id, 'phone', event.target.value)} placeholder={t('phoneNumber')} />
                {contact.phone.trim() ? <a className="button call-button" href={`tel:${contact.phone.replace(/[^+\d]/g, '')}`}><Phone size={17} /> {t('call')}</a> : <button className="button call-button" type="button" onClick={() => notify(t('noNumber'), 'error')}><Phone size={17} /> {t('call')}</button>}
              </div>
            ))}
            <button className="button primary" type="button" onClick={saveContacts}><Save size={17} /> {t('saveContacts')}</button>
          </div>

          <div className="offline-safety-card">
            <h3>{t('safetySteps')}</h3>
            <ol>
              <li>{t('safety1')}</li>
              <li>{t('safety2')}</li>
              <li>{t('safety3')}</li>
            </ol>
          </div>
        </div>
      </section>
    </div>
  );
}
