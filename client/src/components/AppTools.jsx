import { useEffect, useState } from 'react';
import { Download, Languages, Moon, Monitor, Sun } from 'lucide-react';
import { useAppSettings } from '../context/AppSettings.jsx';

export default function AppTools({ login = false }) {
  const { language, toggleLanguage, theme, setTheme, t } = useAppSettings();
  const [installPrompt, setInstallPrompt] = useState(null);
  const [installed, setInstalled] = useState(() => window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone);

  useEffect(() => {
    const beforeInstall = (event) => {
      event.preventDefault();
      setInstallPrompt(event);
    };
    const onInstalled = () => {
      setInstallPrompt(null);
      setInstalled(true);
    };
    window.addEventListener('beforeinstallprompt', beforeInstall);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', beforeInstall);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  async function install() {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    if (choice.outcome === 'accepted') setInstallPrompt(null);
  }

  const ThemeIcon = theme === 'dark' ? Moon : theme === 'system' ? Monitor : Sun;

  return (
    <div className={`app-tools ${login ? 'login-tools' : ''}`}>
      <button className="tool-button language-button" type="button" onClick={toggleLanguage} title={t('switchLanguage')}>
        <Languages size={17} /><span>{language === 'en' ? 'বাংলা' : 'EN'}</span>
      </button>
      <label className="theme-select" title="Theme">
        <ThemeIcon size={16} />
        <select value={theme} onChange={(event) => setTheme(event.target.value)} aria-label="Theme">
          <option value="light">{t('themeLight')}</option>
          <option value="dark">{t('themeDark')}</option>
          <option value="system">{t('themeSystem')}</option>
        </select>
      </label>
      {!installed && installPrompt && (
        <button className="tool-button install-button" type="button" onClick={install}>
          <Download size={17} /><span>{t('installApp')}</span>
        </button>
      )}
    </div>
  );
}
