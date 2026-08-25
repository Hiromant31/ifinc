'use client';

import type { Goal, State } from '@/lib/types';
import { fmt, money } from '@/lib/format';
import { today0 } from '@/lib/cycle';

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

const DAY = 86400000;

function monthDaysLeft() {
  const n = new Date();
  return new Date(n.getFullYear(), n.getMonth() + 1, 0).getDate() - n.getDate() + 1;
}

function d2(ts?: number | null) {
  if (!ts) return '';
  return new Date(ts).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit' });
}

/** карточка дополнительной цели — как раньше */
function OptCard(p: {
  g: Goal;
  onDeposit: (g: Goal) => void; onWithdraw: (g: Goal) => void; onExec: (g: Goal) => void;
  onEditGoal: (id: string) => void; onDeleteGoal: (id: string) => void;
}) {
  const g = p.g;
  const pct = Math.min(100, g.saved / g.target * 100);
  const left = Math.max(0, g.target - g.saved);
  return (
    <article className={'goal ' + g.status}>
      <header>
        <span className="g-ico">{g.icon}</span>
        <b>{g.name}</b>
        <span className="tag dim2">ДОП</span>
        {g.status === 'funded' && <span className="tag acc">НАКОПЛЕНА ✔</span>}
      </header>
      <div className={'hbar' + (g.status === 'funded' ? ' acc' : '')}>
        <div className="hbar-fill" style={{ width: pct + '%' }} />
      </div>
      <div className="row2">
        <span><b>{fmt(g.saved)}</b> ИЗ {fmt(g.target)}</span>
        <span>−{fmt(left)} · {Math.round(pct)}%</span>
      </div>
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

/** карточка циклической обязательной цели */
function ReqCard(p: {
  g: Goal;
  onDeposit: (g: Goal) => void; onWithdraw: (g: Goal) => void; onExec: (g: Goal) => void;
  onEditGoal: (id: string) => void; onDeleteGoal: (id: string) => void;
}) {
  const g = p.g;
  const today = today0().getTime();
  const end = new Date(g.cycleEnd ?? Date.now()).getTime();
  const due = today >= end && g.status !== 'done';
  const overdueD = Math.floor((today - end) / DAY);
  const pct = Math.min(100, g.saved / g.target * 100);
  const left = Math.max(0, g.target - g.saved);
  const days = Math.max(0, Math.round((end - today) / DAY));
  const cls = 'goal' + (g.status === 'funded' ? ' funded' : '') + (g.status === 'done' ? ' reqdone' : '') + (due ? ' due' : '');

  let st = null;
  if (g.status === 'done') st = <span className="tag ink">ИСПОЛНЕНА ✔</span>;
  else if (due) st = <span className="tag acc">{overdueD <= 0 ? '⚠ ИСПОЛНИТЬ СЕГОДНЯ' : '⚠ ПРОСРОЧКА ' + overdueD + ' ДН'}</span>;
  else if (g.status === 'funded') st = <span className="tag acc">НАКОПЛЕНА ✔</span>;

  let line2 = null;
  if (g.status === 'done') {
    line2 = <div className="pace" style={{ color: 'var(--dim)' }}>ИСПОЛНЕНА {d2(g.doneAt)} · ДО ОБНОВЛЕНИЯ {days} ДН</div>;
  } else if (due) {
    line2 = <div className="pace">{overdueD <= 0 ? '⚠ ДАТА ОБНОВЛЕНИЯ СЕГОДНЯ — ИСПОЛНИ!' : '⚠ ПРОСРОЧКА ' + overdueD + ' ДН — ИСПОЛНИ!'}</div>;
  } else {
    line2 = <div className="pace">⚡ ТЕМП {money(left / Math.max(1, days))}/ДЕНЬ · ДО ОБНОВЛЕНИЯ {days} ДН</div>;
  }

  let acts = null;
  if (g.status !== 'done') {
    acts = (
      <>
        {g.status === 'funded'
          ? <button type="button" className="btn gold" onClick={() => p.onExec(g)}>✓ Исполнить</button>
          : <button type="button" className={'btn' + (due ? ' acc' : ' ink')} onClick={() => p.onDeposit(g)}>＋ Пополнить</button>}
        <button type="button" className="sq" title="вернуть с цели" onClick={() => p.onWithdraw(g)}>↩</button>
      </>
    );
  }

  return (
    <article className={cls}>
      <header>
        <span className="g-ico">{g.icon}</span>
        <b>{g.name}</b>
        <span className="tag ink">ОБЯЗАТЕЛЬНАЯ</span>
        {g.cycleDay
          ? <span className="tag dim2">ЦИКЛ {g.cycleDay} ЧИСЛА</span>
          : <span className="tag dim2">ЦИКЛ: МЕСЯЦ</span>}
        {st}
      </header>
      <div className={'hbar' + (g.status === 'done' || g.status === 'funded' ? ' acc' : '')}>
        <div className="hbar-fill" style={{ width: pct + '%' }} />
      </div>
      <div className="row2">
        <span><b>{fmt(g.saved)}</b> ИЗ {fmt(g.target)}</span>
        <span>{g.status === 'done' ? 'ЗАКРЫТА ДО ОБНОВЛЕНИЯ' : '−' + fmt(left) + ' · ' + Math.round(pct) + '%'}</span>
      </div>
      {line2}
      <div className="acts">
        {acts}
        <button type="button" className="sq" title="изменить" onClick={() => p.onEditGoal(g.id)}>✎</button>
        <button type="button" className="sq" title="удалить" onClick={() => p.onDeleteGoal(g.id)}>✕</button>
      </div>
    </article>
  );
}

export default function GoalsScreen(p: Props) {
  const daysLeft = monthDaysLeft();
  const req = p.state.goals.filter(g => g.cat === 'req');
  const opt = p.state.goals.filter(g => g.cat !== 'req' && g.status !== 'done');
  // полка достижений — только дополнительные разовые цели
  const done = [...p.state.goals.filter(g => g.status === 'done' && g.cat === 'opt')]
    .sort((a, b) => (b.doneAt || 0) - (a.doneAt || 0));

  let savedSum = 0, targetSum = 0;
  for (const g of p.state.goals) {
    if (g.status !== 'done') { savedSum += g.saved; targetSum += g.target; }
  }
  const pctT = targetSum ? Math.min(100, savedSum / targetSum * 100) : 0;

  const cardProps = {
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

      <div className="lbl" style={{ margin: '0 0 8px' }}>Обязательные · цикл каждый месяц</div>
      {req.length
        ? req.map(g => <ReqCard key={g.id} g={g} {...cardProps} />)
        : <div className="empty">НЕТ ОБЯЗАТЕЛЬНОЙ ЦЕЛИ — ДОБАВЬ (НАПР. КВАРТИРА)</div>}

      <div className="lbl" style={{ margin: '14px 0 8px' }}>Дополнительные</div>
      {opt.length
        ? opt.map(g => <OptCard key={g.id} g={g} {...cardProps} />)
        : <div className="empty">ДОПОЛНИТЕЛЬНЫХ ЦЕЛЕЙ ПОКА НЕТ</div>}

      <div className="shead">
        <h2>ПОЛКА ДОСТИЖЕНИЙ</h2><span className="hint">{done.length}</span>
        <div className="sp" />
        <button type="button" className="btn sm" onClick={p.onToggleShelf}>{p.shelfOpen ? '▲ Свернуть' : '▼ Развернуть'}</button>
      </div>
      <div className="done-shelf" hidden={!p.shelfOpen}>
        {done.length
          ? done.map(d => (
            <div key={d.id} className="trophy">{d.icon} {d.name.toUpperCase()} <small>{d2(d.doneAt)}</small></div>
          ))
          : <div className="empty" style={{ width: '100%' }}>ПОЛКА ПУСТА — ИСПОЛНИ ПЕРВУЮ ЦЕЛЬ</div>}
      </div>
    </section>
  );
}
