import { CheckCircle2, Circle, FileText, Github, Languages, Moon, Smartphone, Video, WifiOff } from 'lucide-react';
import SectionHeader from '../components/SectionHeader.jsx';
import { useAppSettings } from '../context/AppSettings.jsx';

export default function ChecklistPage() {
  const { t } = useAppSettings();
  const rows = [
    ['M1', t('rowM1'), true],
    ['M2', t('rowM2'), true],
    ['M3', t('rowM3'), true],
    ['M4', t('rowM4'), true],
    ['M5', t('rowM5'), true],
    ['M6', t('rowM6'), true],
    ['PWA', t('pwaReady'), true],
    ['Offline', t('offlineReady'), true],
    ['Docs', t('rowDocs'), true],
    ['Submit', t('rowSubmit'), false]
  ];

  return (
    <div>
      <SectionHeader eyebrow={t('submissionReadiness')} title={t('juniorChecklist')} description={t('checklistDescription')} />
      <section className="panel checklist-panel">
        {rows.map(([code, text, complete]) => <div className="check-row" key={code}><span>{complete ? <CheckCircle2 /> : <Circle />}</span><b>{code}</b><p>{text}</p><em className={complete ? 'done' : ''}>{complete ? t('implementedLabel') : t('teamAction')}</em></div>)}
      </section>

      <section className="submission-cards feature-cards">
        <article className="panel"><Languages /><h3>{t('bilingualReady')}</h3><p>{t('bilingualReadyText')}</p></article>
        <article className="panel"><Moon /><h3>{t('themeReady')}</h3><p>{t('themeReadyText')}</p></article>
        <article className="panel"><Smartphone /><h3>{t('pwaReady')}</h3><p>{t('pwaReadyText')}</p></article>
        <article className="panel"><WifiOff /><h3>{t('offlineReady')}</h3><p>{t('offlineReadyText')}</p></article>
      </section>

      <section className="submission-cards">
        <article className="panel"><FileText /><h3>README.md</h3><p>{t('readmeText')}</p></article>
        <article className="panel"><Github /><h3>GitHub</h3><p>{t('githubText')}</p></article>
        <article className="panel"><Video /><h3>Demo video</h3><p>{t('videoText')}</p></article>
      </section>
    </div>
  );
}
