import { ShieldAlert, ShieldCheck } from 'lucide-react';
import { useAppSettings } from '../context/AppSettings.jsx';

export default function StrikeMeter({ summary, compact = false }) {
  const { t } = useAppSettings();
  const warnings = summary?.warningCount || 0;
  const percentage = Math.min((warnings / 3) * 100, 100);
  const impeached = summary?.impeached;
  const left = summary?.strikesLeft ?? 3;

  return (
    <div className={`strike-meter ${compact ? 'compact' : ''} ${impeached ? 'impeached' : ''}`}>
      <div className="strike-topline">
        <div className="strike-icon">{impeached ? <ShieldCheck /> : <ShieldAlert />}</div>
        <div>
          <span className="label">{t('impeachmentTracker')}</span>
          <strong>{impeached ? t('protocolComplete') : t('warnings', { count: warnings })}</strong>
        </div>
        <span className="strike-value">{impeached ? t('impeached') : t('strikesLeft', { count: left })}</span>
      </div>
      <div className="progress-track" aria-label={`${warnings} of 3 warnings`}>
        <div className="progress-fill" style={{ width: `${percentage}%` }} />
        {[1, 2, 3].map((step) => <span key={step} className={warnings >= step ? 'active' : ''} style={{ left: `${(step / 3) * 100}%` }} />)}
      </div>
      {!compact && <p>{impeached ? t('threeReached') : t('complaintsRemaining', { count: left })}</p>}
    </div>
  );
}
