import { useEffect, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from 'chart.js';
import { Coins, PlusCircle, UtensilsCrossed } from 'lucide-react';
import SectionHeader from '../components/SectionHeader.jsx';
import { useAppSettings } from '../context/AppSettings.jsx';
import { api, formatDate } from '../lib/api.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

export default function LedgerPage({ role, notify, onSummary }) {
  const { t, language, resolvedTheme } = useAppSettings();
  const [entryType, setEntryType] = useState('payment');
  const [amount, setAmount] = useState('2');
  const [foodItem, setFoodItem] = useState('Sandwich');
  const [quantity, setQuantity] = useState('1');
  const [data, setData] = useState({ rows: [], recent: [], summary: {} });
  const [loading, setLoading] = useState(false);

  async function load() {
    try {
      const result = await api('/ledger');
      setData(result);
      onSummary(result.summary);
    } catch (error) {
      notify(error.message, 'error');
    }
  }

  useEffect(() => { load(); }, []);

  async function submit(event) {
    event.preventDefault();
    setLoading(true);
    try {
      await api('/ledger', { method: 'POST', body: JSON.stringify({ entryType, amount, foodItem, quantity }) });
      notify(t('ledgerSaved'));
      await load();
    } catch (error) {
      notify(error.message, 'error');
    } finally {
      setLoading(false);
    }
  }

  const chartData = {
    labels: data.rows.map((row) => new Date(`${row.day}T00:00:00`).toLocaleDateString(language === 'bn' ? 'bn-BD' : 'en-BD', { month: 'short', day: 'numeric' })),
    datasets: [
      { label: t('cashExtorted'), data: data.rows.map((row) => row.money), borderRadius: 7 },
      { label: t('foodItems'), data: data.rows.map((row) => row.food), borderRadius: 7 }
    ]
  };

  const textColor = resolvedTheme === 'dark' ? '#d8e4dc' : '#637067';
  const gridColor = resolvedTheme === 'dark' ? 'rgba(255,255,255,.09)' : 'rgba(23,59,41,.08)';

  return (
    <div>
      <SectionHeader eyebrow={t('mission04')} title={t('m4Title')} description={t('ledgerDescription')} />
      <section className="metric-grid two">
        <article className="metric-card"><div className="metric-icon"><Coins /></div><div><span>{t('totalPayments')}</span><strong>৳{Number(data.summary?.totalMoney || 0).toFixed(0)}</strong><small>{t('acrossEntries')}</small></div></article>
        <article className="metric-card"><div className="metric-icon"><UtensilsCrossed /></div><div><span>{t('totalTiffins')}</span><strong>{data.summary?.totalFood || 0}</strong><small>{t('foodRecorded')}</small></div></article>
      </section>

      <div className="ledger-layout">
        {role === 'student' && (
          <section className="panel form-panel">
            <div className="panel-title"><div className="panel-icon"><PlusCircle /></div><div><h2>{t('addEntry')}</h2><p>{t('noRollStored')}</p></div></div>
            <form className="stack-form" onSubmit={submit}>
              <div className="segmented-control small">
                <button type="button" className={entryType === 'payment' ? 'active' : ''} onClick={() => setEntryType('payment')}>{t('forcedPayment')}</button>
                <button type="button" className={entryType === 'food' ? 'active' : ''} onClick={() => setEntryType('food')}>{t('stolenTiffin')}</button>
              </div>
              {entryType === 'payment' ? (
                <label>{t('amountTaka')}<input type="number" min="1" max="1000" value={amount} onChange={(e) => setAmount(e.target.value)} /></label>
              ) : (
                <><label>{t('foodItem')}<input value={foodItem} onChange={(e) => setFoodItem(e.target.value)} placeholder={t('foodPlaceholder')} /></label><label>{t('quantity')}<input type="number" min="1" max="50" value={quantity} onChange={(e) => setQuantity(e.target.value)} /></label></>
              )}
              <button className="button primary" disabled={loading}>{loading ? t('saving') : t('saveEntry')}</button>
            </form>
          </section>
        )}

        <section className="panel chart-panel">
          <div className="panel-title"><div className="panel-icon"><Coins /></div><div><h2>{t('timeline')}</h2><p>{t('timelineText')}</p></div></div>
          <div className="chart-wrap"><Bar data={chartData} options={{ responsive: true, maintainAspectRatio: false, scales: { x: { ticks: { color: textColor }, grid: { color: gridColor } }, y: { beginAtZero: true, ticks: { precision: 0, color: textColor }, grid: { color: gridColor } } }, plugins: { legend: { position: 'bottom', labels: { color: textColor } } } }} /></div>
        </section>
      </div>

      <section className="panel table-panel">
        <div className="panel-title"><div><h2>{t('recentEntries')}</h2><p>{t('latestRecords')}</p></div></div>
        <div className="data-table-wrap">
          <table className="data-table"><thead><tr><th>{t('type')}</th><th>{t('details')}</th><th>{t('loggedAt')}</th></tr></thead><tbody>
            {data.recent.map((row) => <tr key={row.id}><td><span className={`status-tag ${row.entry_type}`}>{row.entry_type === 'payment' ? t('payment') : t('food')}</span></td><td>{row.entry_type === 'payment' ? `৳${row.amount}` : `${row.food_item} × ${row.quantity}`}</td><td>{formatDate(row.created_at, language)}</td></tr>)}
          </tbody></table>
        </div>
      </section>
    </div>
  );
}
