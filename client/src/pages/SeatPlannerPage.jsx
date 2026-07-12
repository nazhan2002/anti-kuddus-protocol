import { useMemo, useState } from 'react';
import { LayoutGrid, Plus, RotateCcw, Trash2, UsersRound } from 'lucide-react';
import SectionHeader from '../components/SectionHeader.jsx';
import { useAppSettings } from '../context/AppSettings.jsx';

const starterStudents = [
  { id: 1, name: 'Mim', roll: '704', height: 145 },
  { id: 2, name: 'Rafi', roll: '703', height: 151 },
  { id: 3, name: 'Nabila', roll: '702', height: 156 },
  { id: 4, name: 'Siam', roll: '705', height: 163 },
  { id: 5, name: 'Araf', roll: '701', height: 169 },
  { id: 6, name: 'Hasib', roll: '707', height: 174 }
];

export default function SeatPlannerPage({ notify }) {
  const { t } = useAppSettings();
  const [students, setStudents] = useState(starterStudents);
  const [form, setForm] = useState({ name: '', roll: '', height: '' });
  const [rows, setRows] = useState(3);
  const [columns, setColumns] = useState(3);

  const sorted = useMemo(() => [...students].sort((a, b) => Number(a.height) - Number(b.height)), [students]);
  const capacity = rows * columns;
  const seats = Array.from({ length: capacity }, (_, index) => sorted[index] || null);

  function addStudent(event) {
    event.preventDefault();
    if (!form.name.trim() || !form.roll.trim() || Number(form.height) < 80 || Number(form.height) > 230) {
      return notify(t('invalidStudent'), 'error');
    }
    if (students.some((student) => student.roll === form.roll.trim())) return notify(t('duplicateRoll'), 'error');
    setStudents((current) => [...current, { id: Date.now(), name: form.name.trim(), roll: form.roll.trim(), height: Number(form.height) }]);
    setForm({ name: '', roll: '', height: '' });
    notify(t('studentAdded'));
  }

  return (
    <div>
      <SectionHeader eyebrow={t('mission02')} title={t('m2Title')} description={t('seatDescription')} />
      <div className="seat-layout">
        <section className="panel form-panel">
          <div className="panel-title"><div className="panel-icon"><UsersRound /></div><div><h2>{t('studentRecords')}</h2><p>{t('studentRecordsText')}</p></div></div>
          <form className="compact-form" onSubmit={addStudent}>
            <input aria-label={t('studentName')} placeholder={t('studentName')} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <input aria-label={t('roll')} placeholder={t('roll')} value={form.roll} onChange={(e) => setForm({ ...form, roll: e.target.value })} />
            <input aria-label={t('heightCm')} type="number" placeholder={t('heightCm')} value={form.height} onChange={(e) => setForm({ ...form, height: e.target.value })} />
            <button className="button primary icon-button" aria-label={t('addStudent')}><Plus /></button>
          </form>
          <div className="record-list">
            {sorted.map((student, index) => (
              <div className="record-row" key={student.id}>
                <span className="order-number">{index + 1}</span>
                <div><strong>{student.name}</strong><small>{t('roll')} {student.roll}</small></div>
                <b>{student.height} cm</b>
                <button type="button" aria-label={t('removeStudent', { name: student.name })} onClick={() => setStudents((current) => current.filter((item) => item.id !== student.id))}><Trash2 size={17} /></button>
              </div>
            ))}
          </div>
          <button className="button ghost full" type="button" onClick={() => setStudents(starterStudents)}><RotateCcw size={17} /> {t('resetDemo')}</button>
        </section>

        <section className="panel classroom-panel">
          <div className="classroom-controls">
            <div className="panel-title"><div className="panel-icon"><LayoutGrid /></div><div><h2>{t('classroomGrid')}</h2><p>{t('classroomGridText')}</p></div></div>
            <div className="grid-controls">
              <label>{t('rows')}<input type="number" min="1" max="6" value={rows} onChange={(e) => setRows(Math.min(6, Math.max(1, Number(e.target.value))))} /></label>
              <span>×</span>
              <label>{t('columns')}<input type="number" min="1" max="6" value={columns} onChange={(e) => setColumns(Math.min(6, Math.max(1, Number(e.target.value))))} /></label>
            </div>
          </div>
          <div className="teacher-desk">{t('teacherPodium')}</div>
          <div className="classroom-grid" style={{ gridTemplateColumns: `repeat(${columns}, minmax(110px, 1fr))` }}>
            {seats.map((student, index) => (
              <div className={`desk ${student ? '' : 'empty'}`} key={index}>
                <span>{index < columns ? t('frontRow') : t('rowNumber', { count: Math.floor(index / columns) + 1 })}</span>
                {student ? <><strong>{student.name}</strong><small>{t('roll')} {student.roll} · {student.height} cm</small></> : <><strong>{t('emptyDesk')}</strong><small>{t('availableSeat')}</small></>}
              </div>
            ))}
          </div>
          {students.length > capacity && <div className="inline-warning">{t('studentsDoNotFit', { count: students.length - capacity })}</div>}
          <div className="legend"><span><i className="dot front" />{t('shorterFront')}</span><span><i className="dot back" />{t('tallerBack')}</span></div>
        </section>
      </div>
    </div>
  );
}
