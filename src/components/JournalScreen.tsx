'use client';

import { useState } from 'react';
import type { State, Tx } from '@/lib/types';
import { fmt, esc } from '@/lib/format';
import { MONTHS } from '@/lib/constants';
import RingChart from './RingChart';

interface Seg { frac: number; f: number; name: string; amt: number }

interface Props {
  state: State;
  onDelTx: (id: string) => void;
  onExportTx: () => void;
  onExportGoals: () => void;
}

const FILLS_CSS = [
  '#242A20', '#D2694A',
  'repeating-linear-gradient(90deg,#242A20 0 1.4px,transparent 1.4px 5px)',
  'repeating-linear-gradient(90deg,#D2694A 0 1.4px,transparent 1.4px 5px)',
  'rgba(36,42,32,.55)',
  'repeating-linear-gradient(90deg,rgba(36,42,32,.55) 0 1.4px,transparent 1.4px 5px)',
  '#F2E8DA',
  'repeating-linear-gradient(90deg,#F2E8DA 0 1.4px,transparent 1.4px 5px)',
];

function txSide(t: Tx): 'in' | 'out' {
  if (t.type === 'in') return 'in';
  if (t.type === 'out') return 'out';
  return t.amount >= 0 ? 'in' : 'out';
}

function d2(ts: number) {
  return new Date(ts).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit' });
}

export default function JournalScreen({ state, onDelTx, onExportTx, onExportGoals }: Props) {
  const today = new Date();
  const [jY, setJY] = useState(today.getFullYear());
  const [jM, setJM] = useState(today.getMonth());
  const [jTab, setJTab] = useState<'all' | 'in' | 'out'>('all');

  const list = state.transactions.filter(t => {
    const d = new Date(t.ts);
    return d.getFullYear() === jY && d.getMonth() === jM;
  });

  let tin = 0, tout = 0;
  for (const t of list) {
    if (txSide(t) === 'in') tin += Math.abs(t.amount); else tout += Math.abs(t.amount);
  }

  const segs: Seg[] = [];
  let center = 0, clbl = '';
  if (jTab === 'all') {
    const total = tin + tout;
    if (tin > 0) segs.push({ frac: total ? tin / total : 0, f: 0, name: 'Доходы', amt: tin });
    if (tout > 0) segs.push({ frac: total ? tout / total : 0, f: 1, name: 'Расходы', amt: tout });
    center = tin - tout;
    clbl = 'ДОХОД − РАСХОД';
  } else {
    const map: Record<string, number> = {};
    let sum = 0;
    for (const x of list) {
      if (txSide(x) !== jTab) continue;
      const a = Math.abs(x.amount);
      const cat = x.cat && x.cat.trim() ? x.cat.trim() : 'Другое';
      map[cat] = (map[cat] || 0) + a;
      sum += a;
    }
    const keys = Object.keys(map).sort((a, b) => map[b] - map[a]);
    keys.forEach((k, i) => segs.push({ frac: sum ? map[k] / sum : 0, f: i % FILLS_CSS.length, name: k, amt: map[k] }));
    center = sum;
    clbl = jTab === 'in' ? 'ДОХОДЫ ЗА МЕСЯЦ' : 'РАСХОДЫ ЗА МЕСЯЦ';
  }

  const show = [...list].filter(x => jTab === 'all' || txSide(x) === jTab).sort((a, b) => b.ts - a.ts);

  return (
    <section id="screenFin">
      <div className="shead">
        <h2>ЖУРНАЛ</h2>
        <div className="sp" />
        <button type="button" className="btn sm" onClick={onExportTx}>⤓ Excel · операции</button>
        <button type="button" className="btn sm" onClick={onExportGoals}>⤓ Excel · цели</button>
      </div>

      <div className="mnav">
        <button type="button" className="sq" aria-label="предыдущий месяц"
          onClick={() => { let m = jM - 1, y = jY; if (m < 0) { m = 11; y--; } setJM(m); setJY(y); }}>‹</button>
        <b id="jMonth">{MONTHS[jM]} {jY}</b>
        <button type="button" className="sq" aria-label="следующий месяц"
          onClick={() => { let m = jM + 1, y = jY; if (m > 11) { m = 0; y++; } setJM(m); setJY(y); }}>›</button>
      </div>

      <div className="jseg">
        <button type="button" className={jTab === 'all' ? 'on-ink' : ''} onClick={() => setJTab('all')}>ОБЩЕЕ</button>
        <button type="button" className={jTab === 'in' ? 'on-ink' : ''} onClick={() => setJTab('in')}>ДОХОДЫ</button>
        <button type="button" className={jTab === 'out' ? 'on-acc' : ''} onClick={() => setJTab('out')}>РАСХОДЫ</button>
      </div>

      <div className="chartwrap">
        <RingChart segments={segs} />
        <div className="center">
          <b id="jCenter" className={center < 0 ? 'neg' : ''}>{(center < 0 ? '−' : '') + fmt(Math.abs(center))}</b>
          <span className="lbl">{clbl}</span>
        </div>
      </div>

      <div id="jLegend" style={{ marginBottom: 14 }}>
        {segs.length === 0
          ? <div className="empty">НЕТ ДАННЫХ ЗА ЭТОТ МЕСЯЦ</div>
          : segs.map((s, i) => (
            <div key={i} className="lg">
              <span className="sw" style={{ background: FILLS_CSS[s.f] }} />
              <span className="nm">{esc(s.name)}</span>
              <span className="pc">{Math.round(s.frac * 100)}% · {fmt(s.amt)}</span>
            </div>
          ))}
      </div>

      <div className="lbl" style={{ margin: '0 0 6px' }}>Операции за месяц</div>
      <div id="txList">
        {show.length === 0
          ? <div className="empty">ОПЕРАЦИЙ ЗА МЕСЯЦ НЕТ</div>
          : show.map(y => {
            const pos = txSide(y) === 'in';
            return (
              <div key={y.id} className="tx">
                <div className="t-l">
                  <b>{esc(y.cat)}</b>
                  <span>{d2(y.ts)}{y.note ? ' · ' + esc(y.note) : ''}</span>
                </div>
                <div className={'t-amt ' + (pos ? 'pos' : 'neg')}>
                  {(pos ? '+' : '−') + fmt(Math.abs(y.amount))}
                </div>
                <button type="button" className="mini-x" onClick={() => onDelTx(y.id)}>✕</button>
              </div>
            );
          })}
      </div>
    </section>
  );
}
