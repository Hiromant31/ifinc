'use client';

import type { Goal, State } from '@/lib/types';
import { fmt, money, esc } from '@/lib/format';

interface Props {
  state: State;
  shelfOpen: boolean;
  onToggleShelf: () => void;
  onAddTx: (t: 'in' | 'out') => void;
  onAdjust: () => void;
  onAuto: () => void;
  onNewGoal: () => void;
  onEditGoal: (id: string) => void;
  onDeleteGoal: (id: string) => void;
  onDeposit: (g: Goal) => void;
  onWithdraw: (g: Goal) => void;
  onExec: (g: Goal) => void;
}

function monthDaysLeft() {
  const n = new Date();
  return new Date(n.getFullYear(), n.getMonth() + 1, 0).getDate() - n.getDate() + 1;
}

function daysUntilCycle(cycleDay: number) {
  const n = new Date();
  const lastThis = new Date(n.getFullYear(), n.getMonth() + 1, 0).getDate();
  const cd = Math.min(cycleDay, lastThis);
  if (n.getDate() < cd) return cd - n.getDate();
  const nm = new Date(n.getFullYear(), n.getMonth() + 1, 1);
  const lastNext = new Date(nm.getFullYear(), nm.getMonth() + 1, 0).getDate();
  return (lastThis - n.getDate()) + Math.min(cycleDay, lastNext);
}

function GoalCard(p: {
  g: Goal; daysLeft: number;
  onDeposit: (g: Goal) => void; onWithdraw: (g: Goal) => void; onExec: (g: Goal) => void;
  onEditGoal: (id: string) => void; onDeleteGoal: (id: string) => void;
}) {
  const g = p.g;
  const pct = Math.min(100, g.saved / g.target * 100);
  const left = Math.max(0, g.target - g.saved);
  let tag = g.cat === 'req' ? <span className="tag ink">ОБЯЗАТЕЛЬНАЯ</span> : <span className="tag dim2">ДОП</span>;
  if (g.cat === 'req' && g.cycleDay) tag = <>{tag}<span className="tag dim2">ЦИКЛ {g.cycleDay} ЧИСЛА</span></>;
  const st = g.status === 'funded' ? <span className="tag acc">НАКОПЛЕНА ✔</span> : null;
  let pace = null;
  if (g.cat === 'req') {
    const days = g.cycleDay ? daysUntilCycle(g.cycleDay) : p.daysLeft;
    const dl = g.cycleDay ? ('ДО ЦИКЛА (' + g.cycleDay + ' ЧИСЛА) ') : ('ДО КОНЦА МЕСЯЦА ');
    pace = <div className="pace">⚡ ТЕМП {money(left / Math.max(1, days))}/ДЕНЬ · {dl}{days} ДН</div>;
  }
  return (
    <article className={'goal ' + g.status}>
      <header>
        <span className="g-ico">{g.icon}</span>
        <b>{esc(g.name)}</b>
        {tag}{st}
      </header>
      <div className={'hbar' + (g.status === 'funded' ? ' acc' : '')}>
        <div className="hbar-fill" style={{ width: pct + '%' }} />
      </div>
      <div className="row2">
        <span><b>{fmt(g.saved)}</b> ИЗ {fmt(g.target)}</span>
        <span>−{fmt(left)} · {Math.round(pct)}%</span>
      </div>
      {pace}
      <div className="acts">
        {g.status === 'funded'
          ? <button type="button" className="btn acc" onClick={() => p.onExec(g)}>✓ Исполнить (купить)</button>
          : <button type="button" className="btn ink" onClick={() => p.onDeposit(g)}>＋ Пополнить</button>}
        <button type="button" className="sq" title="вернуть с цели" onClick={() => p.onWithdraw(g)}>↩</button>
        <button type="button" className="sq" title="изменить" onClick={() => p.onEditGoal(g.id)}>✎</button>
        <button type="button" className="sq" title="удалить" onClick={() => p.onDeleteGoal(g.id)}>✕</button>
      </div>
    </article>
  );
}

export default function GoalsScreen(p: Props) {
  const daysLeft = monthDaysLeft();
  const req = p.state.goals.filter(g => g.status !== 'done' && g.cat === 'req');
  const opt = p.state.goals.filter(g => g.status !== 'done' && g.cat === 'opt');
  const done = [...p.state.goals.filter(g => g.status === 'done')].sort((a, b) => (b.doneAt || 0) - (a.doneAt || 0));

  let savedSum = 0, targetSum = 0;
  for (const g of p.state.goals) {
    if (g.status !== 'done') { savedSum += g.saved; targetSum += g.target; }
  }
  const pctT = targetSum ? Math.min(100, savedSum / targetSum * 100) : 0;

  const cardProps = {
    daysLeft,
    onDeposit: p.onDeposit, onWithdraw: p.onWithdraw, onExec: p.onExec,
    onEditGoal: p.onEditGoal, onDeleteGoal: p.onDeleteGoal,
  };

  return (
    <section id="screenGoals">
      <div id="balCard">
        <div className="lbl">На руках сейчас</div>
        <div className="big"><span>{fmt(p.state.balance)}</span><i>.0</i></div>
        <div className="r"><span className="lbl">Прогресс целей</span><b>{Math.round(pctT)}%</b></div>
        <div className="hbar tall"><div className="hbar-fill" style={{ width: pctT + '%' }} /></div>
      </div>

      <div className="qa">
        <button type="button" className="btn ink" onClick={() => p.onAddTx('in')}>＋ Доход</button>
        <button type="button" className="btn acc" onClick={() => p.onAddTx('out')}>− Расход</button>
      </div>
      <button type="button" className="linkish" onClick={p.onAdjust}>⚖ Сверить баланс</button>

      <div className="shead">
        <h2>ЦЕЛИ</h2><span className="hint">· {daysLeft} ДН ДО КОНЦА МЕСЯЦА</span>
        <div className="sp" />
        <button type="button" className="btn sm" onClick={p.onAuto}>⚡ Распределить</button>
        <button type="button" className="btn sm acc" onClick={p.onNewGoal}>＋ Цель</button>
      </div>
      <div className="lbl" style={{ margin: '0 0 8px' }}>Обязательные · месяц</div>
      {req.length
        ? req.map(g => <GoalCard key={g.id} g={g} {...cardProps} />)
        : <div className="empty">НЕТ ОБЯЗАТЕЛЬНОЙ ЦЕЛИ — ДОБАВЬ (НАПР. КВАРТИРА)</div>}
      <div className="lbl" style={{ margin: '14px 0 8px' }}>Дополнительные</div>
      {opt.length
        ? opt.map(g => <GoalCard key={g.id} g={g} {...cardProps} />)
        : <div className="empty">ДОПОЛНИТЕЛЬНЫХ ЦЕЛЕЙ ПОКА НЕТ</div>}

      <div className="shead">
        <h2>ПОЛКА ДОСТИЖЕНИЙ</h2><span className="hint">{done.length}</span>
        <div className="sp" />
        <button type="button" className="btn sm" onClick={p.onToggleShelf}>{p.shelfOpen ? '▲ Свернуть' : '▼ Развернуть'}</button>
      </div>
      <div className="done-shelf" hidden={!p.shelfOpen}>
        {done.length
          ? done.map(d => (
            <div key={d.id} className="trophy">{d.icon} {esc(d.name).toUpperCase()} <small>{new Date(d.doneAt || 0).toLocaleDateString('ru-RU')}</small></div>
          ))
          : <div className="empty" style={{ width: '100%' }}>ПОЛКА ПУСТА — ИСПОЛНИ ПЕРВУЮ ЦЕЛЬ</div>}
      </div>
    </section>
  );
}
