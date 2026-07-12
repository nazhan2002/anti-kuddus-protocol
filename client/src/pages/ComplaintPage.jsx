import { useState } from 'react';
import { CheckCircle2, Megaphone, ShieldCheck } from 'lucide-react';
import SectionHeader from '../components/SectionHeader.jsx';
import StrikeMeter from '../components/StrikeMeter.jsx';
import { useAppSettings } from '../context/AppSettings.jsx';
import { api } from '../lib/api.js';

const categories = [
  ['Tiffin Theft', 'categoryTiffin'],
  ['Bribes', 'categoryBribes'],
  ['Syllabus Bloat', 'categorySyllabus'],
  ['Unfair Sports', 'categorySports'],
  ['Washroom Toll', 'categoryWashroom'],
  ['Other', 'categoryOther']
];

export default function ComplaintPage({ summary, onSummary, notify }) {
  const { t } = useAppSettings();
  const [category, setCategory] = useState('Tiffin Theft');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setLoading(true);
    try {
      const result = await api('/complaints', { method: 'POST', body: JSON.stringify({ category, description }) });
      onSummary(result.summary);
      setDescription('');
      notify(result.message);
    } catch (error) {
      notify(error.message, 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <SectionHeader eyebrow={t('mission01')} title={t('m1Title')} description={t('complaintDescription')} />
      <div className="two-column-layout">
        <section className="panel form-panel">
          <div className="panel-title"><div className="panel-icon"><Megaphone /></div><div><h2>{t('logIncident')}</h2><p>{t('incidentHelp')}</p></div></div>
          <form onSubmit={submit} className="stack-form">
            <label>{t('complaintCategory')}<select value={category} onChange={(event) => setCategory(event.target.value)}>{categories.map(([value, key]) => <option key={value} value={value}>{t(key)}</option>)}</select></label>
            <label>{t('description')}<textarea rows="7" maxLength="500" value={description} onChange={(event) => setDescription(event.target.value)} placeholder={t('complaintPlaceholder')} /></label>
            <div className="field-meta"><span>{t('minCharacters')}</span><span>{description.length}/500</span></div>
            <button className="button primary" disabled={loading || description.trim().length < 8}>{loading ? t('delivering') : t('submitComplaint')}</button>
          </form>
        </section>

        <aside className="side-stack">
          <StrikeMeter summary={summary} compact />
          <section className="panel privacy-card">
            <div className="panel-title"><div className="panel-icon"><ShieldCheck /></div><div><h2>{t('privacyDesign')}</h2><p>{t('privacySubtitle')}</p></div></div>
            <ul className="check-list">
              <li><CheckCircle2 />{t('privacy1')}</li>
              <li><CheckCircle2 />{t('privacy2')}</li>
              <li><CheckCircle2 />{t('privacy3')}</li>
            </ul>
          </section>
        </aside>
      </div>
    </div>
  );
}
