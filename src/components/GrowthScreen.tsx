'use client';

import { useState } from 'react';
import type { State } from '@/lib/types';
import { fmt, esc } from '@/lib/format';
import { SKILLS } from '@/lib/constants';

interface Props {
  state: State;
  onAddIdea: (title: string, reward: number) => void;
  onAddTask: (ideaId: string, text: string) => void;
  onToggleTask: (ideaId: string, taskId: string, done: boolean) => void;
  onDeleteTask: (ideaId: string, taskId: string) => void;
  onIdeaSuccess: (ideaId: string) => void;
  onDeleteIdea: (id: string) => void;
  onBuySkill: (id: string) => void;
}

function levelInfo(xp: number) {
  let lvl = 1, need = 150, rem = xp;
  while (rem >= need) { rem -= need; lvl++; need = Math.round(150 * Math.pow(lvl, 1.35)); }
  return { lvl, cur: rem, need };
}

export default function GrowthScreen(p: Props) {
  const [title, setTitle] = useState('');
  const [reward, setReward] = useState('20');
  const [taskInputs, setTaskInputs] = useState<Record<string, string>>({});

  const li = levelInfo(p.state.xp);
  const mult = 1 + 0.15 * p.state.skills.length;

  return (
    <section id="screenGrow">
      <div className="xpblock">
        <div className="lrow"><b>LVL {li.lvl}</b><b>INT {Math.round(p.state.intel)}</b></div>
        <div className="hbar"><div className="hbar-fill" style={{ width: Math.min(100, li.cur / li.need * 100) + '%' }} /></div>
        <div className="xptxt">{fmt(li.cur)} / {fmt(li.need)} XP · БУСТ ×{Math.round(mult * 100) / 100}</div>
      </div>

      <div className="shead"><h2>ИДЕИ И ТЕСТЫ</h2></div>
      <form
        className="stack"
        autoComplete="off"
        style={{ marginBottom: 14 }}
        onSubmit={e => {
          e.preventDefault();
          const t = title.trim();
          if (!t) return;
          p.onAddIdea(t, Math.max(1, parseInt(reward || '20', 10) || 20));
          setTitle('');
        }}
      >
        <input value={title} onChange={e => setTitle(e.target.value)} placeholder="НОВАЯ ИДЕЯ / ГИПОТЕЗА…" />
        <div style={{ display: 'flex', gap: 8 }}>
          <input value={reward} onChange={e => setReward(e.target.value)} inputMode="numeric" style={{ maxWidth: 74 }} />
          <button type="submit" className="btn ink" style={{ flex: 1 }}>Записать идею</button>
        </div>
      </form>

      <div id="ideaList">
        {p.state.ideas.length === 0 && (
          <div className="empty">ЗАПИШИ ПЕРВУЮ ИДЕЮ — ЗА УСПЕШНЫЕ ТЕСТЫ КАПАЕТ INT</div>
        )}
        {p.state.ideas.map(it => {
          const doneN = it.tasks.filter(t => t.done).length;
          const pctI = it.tasks.length ? doneN / it.tasks.length * 100 : 0;
          return (
            <article key={it.id} className="idea">
              <header>
                <b>💡 {esc(it.title)}</b>
                {it.success
                  ? <span className="tag acc">✔ УСПЕШНЫЙ ТЕСТ</span>
                  : <button type="button" className="btn mini acc" onClick={() => p.onIdeaSuccess(it.id)}>🧪 Успех +{it.reward} INT</button>}
                <button type="button" style={{ border: 'none', background: 'none', color: 'var(--dim)', padding: 6 }} onClick={() => p.onDeleteIdea(it.id)}>✕</button>
              </header>
              <div className="hbar thin"><div className="hbar-fill" style={{ width: pctI + '%' }} /></div>
              <div style={{ marginTop: 8 }}>
                {it.tasks.length === 0 && <div className="empty" style={{ marginTop: 2 }}>ЗАДАЧ НЕТ — ДОБАВЬ ШАГИ ПРОГРЕССА</div>}
                {it.tasks.map(t => (
                  <div key={t.id} className="task-row">
                    <label className="task">
                      <input
                        type="checkbox"
                        checked={t.done}
                        onChange={e => p.onToggleTask(it.id, t.id, e.target.checked)}
                      />
                      <span>{esc(t.text)}</span>
                    </label>
                    <button type="button" style={{ border: 'none', background: 'none', color: 'var(--dim)', padding: 6 }}
                      onClick={() => p.onDeleteTask(it.id, t.id)}>✕</button>
                  </div>
                ))}
              </div>
              <div className="i-add">
                <input
                  placeholder="НОВАЯ ЗАДАЧА (+5 INT)"
                  value={taskInputs[it.id] || ''}
                  onChange={e => setTaskInputs(s => ({ ...s, [it.id]: e.target.value }))}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const v = (taskInputs[it.id] || '').trim();
                      if (!v) return;
                      p.onAddTask(it.id, v);
                      setTaskInputs(s => ({ ...s, [it.id]: '' }));
                    }
                  }}
                />
                <button type="button" className="sq" onClick={() => {
                  const v = (taskInputs[it.id] || '').trim();
                  if (!v) return;
                  p.onAddTask(it.id, v);
                  setTaskInputs(s => ({ ...s, [it.id]: '' }));
                }}>＋</button>
              </div>
            </article>
          );
        })}
      </div>

      <div className="shead"><h2>ДЕРЕВО НАВЫКОВ</h2></div>
      <div className="skill-grid">
        {SKILLS.map(s => {
          const owned = p.state.skills.includes(s.id);
          const locked = !owned && p.state.intel < s.cost;
          return (
            <div key={s.id} className={'skill' + (owned ? ' owned' : '') + (locked ? ' locked' : '')}>
              <span className="s-ico">{s.icon}</span>
              <b>{esc(s.name).toUpperCase()}</b>
              <p>{esc(s.desc)}</p>
              {owned
                ? <span className="tag acc">ИЗУЧЕНО</span>
                : <button type="button" className="btn mini" onClick={() => p.onBuySkill(s.id)}>INT {s.cost}</button>}
            </div>
          );
        })}
      </div>
    </section>
  );
}
