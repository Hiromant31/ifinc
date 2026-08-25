'use client';

import { useEffect, useState } from 'react';
import Sheet from './Sheet';
import { EFFORTS } from '@/lib/growth';

export interface HabitDraft {
  name: string;
  effort: number;
  from: string | null;
  to: string | null;
}

interface Props {
  open: boolean;
  onSubmit: (d: HabitDraft) => void;
  onClose: () => void;
}

export default function HabitSheet(p: Props) {
  const [name, setName] = useState('');
  const [effort, setEffort] = useState(1);
  const [win, setWin] = useState(false);
  const [from, setFrom] = useState('09:00');
  const [to, setTo] = useState('10:00');

  useEffect(() => {
    if (p.open) { setName(''); setEffort(1); setWin(false); setFrom('09:00'); setTo('10:00'); }
  }, [p.open]);

  function submit() {
    const n = name.trim();
    if (!n) return;
    p.onSubmit({ name: n, effort, from: win ? from : null, to: win ? to : null });
  }

  return (
    <Sheet open={p.open} ovId="ovHabit" id="sheetHabit" onClose={p.onClose}>
      <h3>Новая привычка</h3>
      <form onSubmit={e => { e.preventDefault(); submit(); }}>
        <label>Что делаем</label>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="ВСТАВАТЬ ДО 9:00 / ЯЗЫК 5 МИН" autoFocus />
        <label>Сложность · ⭐ за отметку</label>
        <div className="chips-row">
          {EFFORTS.map(z => (
            <button key={z.v} type="button" className={z.v === effort ? 'sel' : ''} onClick={() => setEffort(z.v)}>
              {z.l}
            </button>
          ))}
        </div>
        <label className="ck" style={{ marginTop: 12 }}>
          <input type="checkbox" checked={win} onChange={e => setWin(e.target.checked)} />
          ОКНО ВРЕМЕНИ ДЛЯ ОТМЕТКИ
        </label>
        {win && (
          <div className="winrow" style={{ marginTop: 8 }}>
            <input type="time" value={from} onChange={e => setFrom(e.target.value)} />
            <input type="time" value={to} onChange={e => setTo(e.target.value)} />
          </div>
        )}
        <div className="row">
          <button type="button" className="btn" onClick={p.onClose}>Отмена</button>
          <button type="submit" className="btn ink">Сохранить</button>
        </div>
      </form>
    </Sheet>
  );
}
