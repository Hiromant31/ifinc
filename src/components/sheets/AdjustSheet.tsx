'use client';

import { useEffect, useState } from 'react';
import Sheet from './Sheet';

interface Props {
  open: boolean;
  onSubmit: (factBalance: number) => void;
  onClose: () => void;
}

export default function AdjustSheet(p: Props) {
  const [v, setV] = useState('');

  useEffect(() => {
    if (p.open) setV('');
  }, [p.open]);

  function submit() {
    const n = parseFloat(v.replace(/\s+/g, '').replace(',', '.'));
    if (isNaN(n) || n < 0) return;
    p.onSubmit(n);
  }

  return (
    <Sheet open={p.open} ovId="ovAdjust" id="sheetAdjust" onClose={p.onClose}>
      <h3>⚖ Сверить баланс</h3>
      <p style={{ font: '500 10px var(--sans)', color: 'var(--dim)', letterSpacing: '.06em' }}>
        ВВЕДИ ФАКТИЧЕСКУЮ СУММУ НА РУКАХ — ИГРА ЗАПИШЕТ КОРРЕКТИРОВКУ В ЖУРНАЛ.
      </p>
      <form style={{ marginTop: 12 }} onSubmit={e => { e.preventDefault(); submit(); }}>
        <input value={v} onChange={e => setV(e.target.value)} placeholder="ФАКТ. БАЛАНС, ₽" inputMode="decimal" autoFocus />
        <div className="row">
          <button type="button" className="btn" onClick={p.onClose}>Отмена</button>
          <button type="submit" className="btn ink">Сверить</button>
        </div>
      </form>
    </Sheet>
  );
}
