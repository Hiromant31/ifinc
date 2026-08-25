'use client';

import { useEffect, useState } from 'react';
import Sheet from './Sheet';
import type { State } from '@/lib/types';
import { fmt } from '@/lib/format';
import { SIZES, sizeCost, daysPreview } from '@/lib/growth';

export interface RewardDraft {
  name: string;
  size: 's' | 'm' | 'l' | 'x';
  tied: string | null;
}

interface Props {
  open: boolean;
  state: State;
  onSubmit: (d: RewardDraft) => void;
  onClose: () => void;
}

export default function RewardSheet(p: Props) {
  const [name, setName] = useState('');
  const [size, setSize] = useState<'s' | 'm' | 'l' | 'x'>('s');
  const [tied, setTied] = useState('');

  useEffect(() => {
    if (p.open) { setName(''); setSize('s'); setTied(''); }
  }, [p.open]);

  function submit() {
    const n = name.trim();
    if (!n) return;
    p.onSubmit({ name: n, size, tied: tied || null });
  }

  const cost = sizeCost(size);
  const preview = daysPreview(Math.max(0, cost - p.state.pts), p.state.ptLog);

  return (
    <Sheet open={p.open} ovId="ovReward" id="sheetReward" onClose={p.onClose}>
      <h3>Новая награда</h3>
      <form onSubmit={e => { e.preventDefault(); submit(); }}>
        <label>Приз</label>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="ВКУСНЯШКА / КИНО / ПОКУПКА" autoFocus />
        <label>Размер · цена в ⭐</label>
        <div className="chips-row">
          {SIZES.map(z => (
            <button key={z.id} type="button" className={z.id === size ? 'sel' : ''} onClick={() => setSize(z.id)}>
              {z.l} · {z.cost}⭐
            </button>
          ))}
        </div>
        <div className="xptxt" style={{ marginTop: 8 }}>ЦЕНА {cost}⭐ · {preview}</div>
        <label>Привязать к денежной цели (необязательно)</label>
        <select value={tied} onChange={e => setTied(e.target.value)}>
          <option value="">— НЕ ПРИВЯЗЫВАТЬ —</option>
          {p.state.goals.filter(g => g.status !== 'done').map(g => (
            <option key={g.id} value={g.id}>🎯 {g.name}</option>
          ))}
        </select>
        <div className="row">
          <button type="button" className="btn" onClick={p.onClose}>Отмена</button>
          <button type="submit" className="btn ink">Сохранить</button>
        </div>
      </form>
    </Sheet>
  );
}
