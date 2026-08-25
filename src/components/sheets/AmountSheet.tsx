'use client';

import { useEffect, useState } from 'react';
import Sheet from './Sheet';

interface Props {
  open: boolean;
  title: string;
  btnText: string;
  presetValue?: string;
  onSubmit: (v: number) => void;
  onClose: () => void;
}

export default function AmountSheet(p: Props) {
  const [v, setV] = useState('');

  useEffect(() => {
    if (p.open) setV(p.presetValue || '');
  }, [p.open, p.presetValue]);

  function submit() {
    const n = parseFloat(v.replace(/\s+/g, '').replace(',', '.'));
    if (!(n > 0)) return;
    p.onSubmit(n);
    setV('');
  }

  return (
    <Sheet open={p.open} ovId="ovAmount" id="sheetAmount" onClose={p.onClose}>
      <h3>{p.title}</h3>
      <form onSubmit={e => { e.preventDefault(); submit(); }}>
        <input value={v} onChange={e => setV(e.target.value)} placeholder="0" inputMode="decimal" autoFocus />
        <div className="row">
          <button type="button" className="btn" onClick={p.onClose}>Отмена</button>
          <button type="submit" className="btn acc">{p.btnText}</button>
        </div>
      </form>
    </Sheet>
  );
}
