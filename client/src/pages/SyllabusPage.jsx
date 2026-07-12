import { useState } from 'react';
import { BookOpenCheck, Copy, Sparkles, WandSparkles } from 'lucide-react';
import SectionHeader from '../components/SectionHeader.jsx';
import { useAppSettings } from '../context/AppSettings.jsx';
import { api } from '../lib/api.js';

const demoTexts = {
  en: `For the next 10-mark class test, study Chapters 1 to 7. Also memorize the writer's biography, the book index, the barcode on the back cover, every footnote, and the colour of the cover. Focus especially on photosynthesis, plant nutrition, respiration, and the diagrams from Chapters 3 and 4.`,
  bn: `আগামী ১০ নম্বরের ক্লাস টেস্টের জন্য ১ থেকে ৭ অধ্যায় পড়তে হবে। লেখকের জীবনী, বইয়ের সূচি, পেছনের কভারের বারকোড, সব ফুটনোট এবং কভারের রংও মুখস্থ করতে হবে। বিশেষভাবে সালোকসংশ্লেষণ, উদ্ভিদের পুষ্টি, শ্বসন এবং ৩ ও ৪ অধ্যায়ের চিত্রগুলো পড়তে হবে।`
};

export default function SyllabusPage({ notify }) {
  const { t, language } = useAppSettings();
  const [syllabus, setSyllabus] = useState(demoTexts[language]);
  const [summary, setSummary] = useState('');
  const [mode, setMode] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);

  async function summarize() {
    setLoading(true);
    setNote('');
    try {
      const result = await api('/summarize', { method: 'POST', body: JSON.stringify({ syllabus, language }) });
      setSummary(result.summary);
      setMode(result.mode);
      setNote(result.note || '');
      notify(result.mode === 'gemini' ? t('geminiGenerated') : t('demoGenerated'));
    } catch (error) {
      notify(error.message, 'error');
    } finally {
      setLoading(false);
    }
  }

  async function copySummary() {
    await navigator.clipboard.writeText(summary);
    notify(t('copied'));
  }

  return (
    <div>
      <SectionHeader eyebrow={t('mission03')} title={t('m3Title')} description={t('syllabusDescription')} />
      <div className="two-column-layout equal">
        <section className="panel form-panel">
          <div className="panel-title"><div className="panel-icon"><BookOpenCheck /></div><div><h2>{t('pasteSyllabus')}</h2><p>{t('syllabusLimit')}</p></div></div>
          <textarea className="large-textarea" rows="15" maxLength="6000" value={syllabus} onChange={(e) => setSyllabus(e.target.value)} />
          <div className="field-meta"><button type="button" className="text-button" onClick={() => setSyllabus(demoTexts[language])}>{t('loadDemo')}</button><span>{syllabus.length}/6000</span></div>
          <button className="button primary full" type="button" onClick={summarize} disabled={loading || syllabus.trim().length < 25}><WandSparkles size={18} />{loading ? t('negotiating') : t('summarizeAi')}</button>
        </section>

        <section className="panel result-panel">
          <div className="panel-title"><div className="panel-icon"><Sparkles /></div><div><h2>{t('cleanTopics')}</h2><p>{mode === 'gemini' ? t('liveGemini') : mode === 'demo' ? t('localDemo') : t('resultAppears')}</p></div></div>
          {summary ? (
            <>
              <div className="summary-output">{summary}</div>
              {note && <div className="inline-warning subtle">{language === 'bn' ? 'লোকাল ডেমো মোড চালু আছে। লাইভ AI-এর জন্য .env ফাইলে GEMINI_API_KEY যোগ করুন।' : note}</div>}
              <button className="button ghost" type="button" onClick={copySummary}><Copy size={17} /> {t('copyResult')}</button>
            </>
          ) : (
            <div className="empty-state"><Sparkles /><strong>{t('noSummary')}</strong><span>{t('noSummaryText')}</span></div>
          )}
        </section>
      </div>
    </div>
  );
}
