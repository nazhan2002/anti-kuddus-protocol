import { useAppSettings } from '../context/AppSettings.jsx';

export default function Brand({ compact = false }) {
  const { language } = useAppSettings();
  return (
    <div className={`brand ${compact ? 'brand-compact' : ''}`}>
      <div className="brand-mark" aria-hidden="true"><span>AK</span></div>
      <div>
        <strong>Anti-Kuddus</strong>
        <small>{language === 'bn' ? 'প্রোটোকল' : 'Protocol'}</small>
      </div>
    </div>
  );
}
