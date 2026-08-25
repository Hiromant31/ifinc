'use client';

import { useEffect, useState } from 'react';
import Sheet from './Sheet';
import type { Goal } from '@/lib/types';
import { GOAL_ICONS } from '@/lib/constants';

interface Props {
  open: boolean;
  editGoal: Goal | null;
  onSubmit: (data: { name: string; target: number; cat: 'req' | 'opt'; cycleDay: number | null; icon: string }) => void;
  onClose: () => void;
}

export default function GoalSheet(p: Props) {
  const [name, setName] = useState('');
  const [target, setTarget] = useState('');
  const [cat, setCat] = useState<'req' | 'opt'>('opt');
  const [cycle, setCycle] = useState('');
  const [icon, setIcon] = useState(GOAL_ICONS[0]);

  useEffect(() => {
    if (!p.open) return;
    if (p.editGoal) {
      setName(p.editGoal.name);
      setTarget(String(p.editGoal.target));
      setCat(p.editGoal.cat);
      setCycle(p.editGoal.cycleDay ? String(p.editGoal.cycleDay) : '');
      setIcon(p.editGoal.icon);
    } else {
      setName(''); setTarget(''); setCat('opt'); setCycle(''); setIcon(GOAL_ICONS[0]);
    }
  }, [p.open, p.editGoal]);

  function submit() {
    const n = name.trim();
    const tg = parseFloat(target.replace(/\s+/g, '').replace(',', '.'));
    if (!n || !(tg > 0)) return;
    const c = Math.round(parseFloat(cycle.replace(',', '.')) || 0);
    p.onSubmit({ name: n, target: tg, cat, cycleDay: c >= 1 && c <= 31 ? c : null, icon });
  }

  return (
    <Sheet open={p.open} ovId="ovGoal" id="sheetGoal" onClose={p.onClose}>
      <h3>{p.editGoal ? 'Изменить цель' : 'Новая цель'}</h3>
      <form onSubmit={e => { e.preventDefault(); submit(); }}>
        <label>Название</label>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="КВАРТИРА (ВЗНОС)" autoFocus />
        <label>Целевая сумма, ₽</label>
        <input value={target} onChange={e => setTarget(e.target.value)} placeholder="450000" inputMode="decimal" />
        <label>Категория</label>
        <select value={cat} onChange={e => setCat(e.target.value as 'req' | 'opt')}>
          <option value="req">ОБЯЗАТЕЛЬНАЯ (МЕСЯЦ)</option>
          <option value="opt">ДОПОЛНИТЕЛЬНАЯ</option>
        </select>
        <label>Дата цикла · день месяца (необязательно)</label>
        <input value={cycle} onChange={e => setCycle(e.target.value)} placeholder="НАПР. 15 — ДЕНЬ ПЛАТЕЖА" inputMode="numeric" />
        <label>Иконка</label>
        <div className="icons">
          {GOAL_ICONS.map((ic, i) => (
            <button key={i} type="button" className={ic === icon ? 'sel' : ''} onClick={() => setIcon(ic)}>{ic}</button>
          ))}
        </div>
        <div className="row">
          <button type="button" className="btn" onClick={p.onClose}>Отмена</button>
          <button type="submit" className="btn ink">Сохранить</button>
        </div>
      </form>
    </Sheet>
  );
}
