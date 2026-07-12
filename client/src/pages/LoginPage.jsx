import { useState } from 'react';
import { Eye, EyeOff, LockKeyhole, Shield, UserRoundCheck } from 'lucide-react';
import Brand from '../components/Brand.jsx';
import AppTools from '../components/AppTools.jsx';
import { useAppSettings } from '../context/AppSettings.jsx';
import { api } from '../lib/api.js';

export default function LoginPage({ onLogin }) {
  const { t } = useAppSettings();
  const [mode, setMode] = useState('student');
  const [value, setValue] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setError('');
    if (!value.trim()) return setError(mode === 'student' ? t('enterSecretRoll') : t('enterCaptainCode'));
    setLoading(true);
    try {
      const result = await api(mode === 'student' ? '/auth/login' : '/auth/captain', {
        method: 'POST',
        body: JSON.stringify(mode === 'student' ? { roll: value } : { code: value })
      });
      onLogin(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-page">
      <AppTools login />
      <section className="login-story">
        <Brand />
        <div className="story-copy">
          <span className="eyebrow light">{t('loginClass')}</span>
          <h1>{t('loginHero').split('\n').map((line, index) => <span key={line}>{line}{index === 0 && <br />}</span>)}</h1>
          <p>{t('loginHeroDescription')}</p>
        </div>
        <div className="story-status">
          <div><Shield size={20} /><span>{t('anonymousReports')}</span></div>
          <div><LockKeyhole size={20} /><span>{t('serverAccess')}</span></div>
          <div><UserRoundCheck size={20} /><span>{t('roleDashboard')}</span></div>
        </div>
      </section>

      <section className="login-panel">
        <div className="login-card">
          <div className="mobile-brand"><Brand compact /></div>
          <span className="eyebrow">{t('secureEntry')}</span>
          <h2>{mode === 'student' ? t('studentLogin') : t('captainLogin')}</h2>
          <p>{mode === 'student' ? t('studentLoginText') : t('captainLoginText')}</p>

          <div className="segmented-control" role="tablist">
            <button type="button" className={mode === 'student' ? 'active' : ''} onClick={() => { setMode('student'); setValue(''); setError(''); }}>{t('student')}</button>
            <button type="button" className={mode === 'captain' ? 'active' : ''} onClick={() => { setMode('captain'); setValue(''); setError(''); }}>{t('captain')}</button>
          </div>

          <form onSubmit={submit}>
            <label htmlFor="login-secret">{mode === 'student' ? t('secretRoll') : t('captainCode')}</label>
            <div className="password-field">
              <input
                id="login-secret"
                type={show ? 'text' : 'password'}
                inputMode={mode === 'student' ? 'numeric' : 'text'}
                placeholder={mode === 'student' ? t('exampleRoll') : t('enterCode')}
                value={value}
                onChange={(event) => setValue(event.target.value)}
                autoComplete="off"
              />
              <button type="button" aria-label={t('showHide')} onClick={() => setShow((current) => !current)}>{show ? <EyeOff size={19} /> : <Eye size={19} />}</button>
            </div>
            {error && <div className="form-error">{error}</div>}
            <button className="button primary full" disabled={loading}>{loading ? t('checking') : t('enterProtocol')}</button>
          </form>

          <div className="demo-note"><strong>{t('demoRolls')}</strong><span>701–712</span></div>
        </div>
      </section>
    </main>
  );
}
