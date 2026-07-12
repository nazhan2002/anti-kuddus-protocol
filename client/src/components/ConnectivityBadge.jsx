import { useEffect, useState } from 'react';
import { Cloud, CloudOff } from 'lucide-react';
import { useAppSettings } from '../context/AppSettings.jsx';

export default function ConnectivityBadge({ queued = 0 }) {
  const { t } = useAppSettings();
  const [online, setOnline] = useState(navigator.onLine);

  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, []);

  return (
    <span className={`connectivity-badge ${online ? 'online' : 'offline'}`}>
      {online ? <Cloud size={14} /> : <CloudOff size={14} />}
      {online ? t('online') : t('offline')}
      {queued > 0 && <b>{queued} {t('queued')}</b>}
    </span>
  );
}
