'use client';

import { useState } from 'react';
import Sheet from './Sheet';
import { IN_CATS, OUT_CATS } from '@/lib/constants';

interface Props {
  open: boolean;
  initialType: 'in' | 'out';
  onSubmit: (type: 'in' | 'out', amount: number, cat: string, note: string) => void;
  onClose: () => void;
}

export default function TxSheet(p: Props) {
  const [t, setT] = useState<'in' | 'out'>(p.initialType);
  const [amount, setAmount] = useState('');
  const [cat, setCat] = useState('');
  const [note, setNote] = useState('');
  const cats = t === 'in' ? IN_CATS : OUT_CATS;
  const curCat = cats.includes(cat) ? cat : cats[0];

  return (
    <Sheet open={p.open} ovId="ovTx" id="sheetTx" onClose={p.onClose}>
      <h3>Новая операция</h3>
      <form
        className="stack"
        autoComplete="off"
        onSubmit={e => {
          e.preventDefault();
          const a = parseFloat(amount.replace(/\s+/g, '').replace(',', '.'));
          if (!(a > 0)) return;
          p.onSubmit(t, a, curCat, note.trim());
          setAmount(''); setNote('');
        }}
      >
        <div className="seg">
          <button type="button" className={t === 'in' ? 'on-in' : ''} onClick={() => setT('in')}>ДОХОД</button>
          <button type="button" className={t === 'out' ? 'on-out' : ''} onClick={() => setT('out')}>РАСХОД</button>
        </div>
        <input value={amount} onChange={e => setAmount(e.target.value)} placeholder="СУММА, ₽" inputMode="decimal" autoFocus />
        <select value={curCat} onChange={e => setCat(e.target.value)}>
          {cats.map(c => <option key={c}>{c}</option>)}
        </select>
        <input value={note} onChange={e => setNote(e.target.value)} placeholder="КОММЕНТАРИЙ" />
        <button type="submit" className="btn ink" style={{ width: '100%' }}>Записать в журнал</button>
      </form>
    </Sheet>
  );
}
